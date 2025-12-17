import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';
import type { DictionaryEntry } from '@/lib/dictionary';

export async function GET(req: NextRequest) {
  try {
    // JWT authentication required
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const limit = searchParams.get('limit');
    const sort = searchParams.get('sort');

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const whereClause: Prisma.VocabularyWhereInput = { userId: user.id };
    if (groupId) {
      whereClause.groupId = groupId;
    }

    const orderBy = sort === 'createdAt' ? { createdAt: 'desc' as const } : { createdAt: 'desc' as const };
    
    const vocabulary = await prisma.vocabulary.findMany({
      where: whereClause,
      include: {
        word: {
          include: {
            definitions: true,
            examples: true
          }
        },
        group: true
      },
      orderBy,
      take: limit ? parseInt(limit) : undefined
    });

    const formatted = vocabulary.map((v) => ({
      id: v.id,
      word: {
        word: v.word.word,
        pronunciation: v.word.pronunciation,
        definitions: v.word.definitions.map((d) => ({
          partOfSpeech: d.partOfSpeech,
          meaning: d.meaning
        }))
      },
      level: v.level,
      reviewCount: v.reviewCount,
      correctCount: v.correctCount,
      createdAt: v.createdAt,
      notes: v.notes,
      groupId: v.groupId,
      group: v.group ? {
        id: v.group.id,
        name: v.group.name,
        color: v.group.color
      } : null
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
    // JWT authentication required
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { word: wordText, wordData, groupId } = await req.json();

    if (!wordText) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    // Word length limit
    const MAX_WORD_LENGTH = 100;
    if (typeof wordText !== 'string' || wordText.length > MAX_WORD_LENGTH) {
      return NextResponse.json(
        { error: `Word too long. Maximum ${MAX_WORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check user's word count limit
    const MAX_WORDS_PER_USER = 5000;
    const currentWordCount = await prisma.vocabulary.count({
      where: { userId: user.id }
    });

    if (currentWordCount >= MAX_WORDS_PER_USER) {
      return NextResponse.json(
        { error: `Word limit reached. Maximum ${MAX_WORDS_PER_USER} words per account.` },
        { status: 400 }
      );
    }

    let word = await prisma.word.findUnique({
      where: { word: wordText.toLowerCase() }
    });

    if (!word) {
      // Use provided word data or fetch from dictionary API
      let dictEntry: DictionaryEntry | null = wordData;
      
      if (!dictEntry) {
        const { fetchFromDictionaryAPI } = await import('@/lib/dictionary-api');
        dictEntry = await fetchFromDictionaryAPI(wordText);
      }
      
      if (!dictEntry) {
        return NextResponse.json(
          { error: 'Word not found in dictionary' },
          { status: 404 }
        );
      }

      // Cache in database
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
        wordId: word.id,
        groupId: groupId || null
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