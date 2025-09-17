import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    // Support both header-based and JWT auth
    const authHeader = req.headers.get('authorization');
    let userId = req.headers.get('x-user-id') || 'default-user';
    
    // Check JWT token if provided
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }
    
    const searchParams = req.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const limit = searchParams.get('limit');
    const sort = searchParams.get('sort');
    
    let user = await prisma.user.findUnique({
      where: { id: userId.includes('-') ? userId : undefined, username: !userId.includes('-') ? userId : undefined }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { username: userId }
      });
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
    // Support both header-based and JWT auth
    const authHeader = req.headers.get('authorization');
    let userId = req.headers.get('x-user-id') || 'default-user';
    
    // Check JWT token if provided
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }
    
    const { word: wordText, wordData, groupId } = await req.json();

    if (!wordText) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { id: userId.includes('-') ? userId : undefined, username: !userId.includes('-') ? userId : undefined }
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
      // Use provided word data or fetch from dictionary API
      let dictEntry = wordData;
      
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