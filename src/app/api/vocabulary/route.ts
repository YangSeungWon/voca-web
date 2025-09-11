import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchWord } from '@/lib/dictionary';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'default-user';
    
    let user = await prisma.user.findUnique({
      where: { username: userId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { username: userId }
      });
    }

    const vocabulary = await prisma.vocabulary.findMany({
      where: { userId: user.id },
      include: {
        word: {
          include: {
            definitions: true,
            examples: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = vocabulary.map(v => ({
      id: v.id,
      word: {
        word: v.word.word,
        pronunciation: v.word.pronunciation,
        definitions: v.word.definitions.map(d => ({
          partOfSpeech: d.partOfSpeech,
          meaning: d.meaning
        }))
      },
      level: v.level,
      createdAt: v.createdAt,
      notes: v.notes
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch vocabulary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'default-user';
    const { word: wordText } = await req.json();

    if (!wordText) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { username: userId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { username: userId }
      });
    }

    let word = await prisma.word.findUnique({
      where: { word: wordText.toLowerCase() }
    });

    if (!word) {
      const dictEntry = await searchWord(wordText);
      if (!dictEntry) {
        return NextResponse.json(
          { error: 'Word not found' },
          { status: 404 }
        );
      }

      word = await prisma.word.create({
        data: {
          word: dictEntry.word,
          pronunciation: dictEntry.pronunciation,
          definitions: {
            create: dictEntry.definitions.map((def, index) => ({
              partOfSpeech: def.partOfSpeech,
              meaning: def.meaning,
              order: index
            }))
          },
          examples: {
            create: dictEntry.definitions.flatMap(def => 
              (def.examples || []).map(ex => ({
                sentence: ex
              }))
            )
          }
        }
      });
    }

    const existing = await prisma.vocabulary.findUnique({
      where: {
        userId_wordId: {
          userId: user.id,
          wordId: word.id
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Word already in vocabulary' },
        { status: 200 }
      );
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        userId: user.id,
        wordId: word.id
      }
    });

    return NextResponse.json(vocabulary);
  } catch (error) {
    console.error('Failed to add word:', error);
    return NextResponse.json(
      { error: 'Failed to add word' },
      { status: 500 }
    );
  }
}