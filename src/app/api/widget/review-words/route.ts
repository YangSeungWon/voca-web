import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Word, Definition } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

/**
 * Widget API: Get words for review
 * Returns words that need review (low level or recently added)
 */
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

    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 5;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get words that need review (level 1-3, or recently added)
    const words = await prisma.vocabulary.findMany({
      where: {
        userId: user.id,
        OR: [
          { level: { lte: 3 } }, // Low level words
          {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        ]
      },
      include: {
        word: {
          include: {
            definitions: true
          }
        }
      },
      orderBy: {
        level: 'asc' // Prioritize lower level words
      },
      take: limit
    });

    // Format response
    type WordWithDefinitions = Word & { definitions: Definition[] };
    const reviewWords = words.map((wordData: { id: string; word: WordWithDefinitions; level: number }) => {
      const wordInfo = wordData.word;
      return {
        id: wordData.id,
        text: wordInfo.word,
        pronunciation: wordInfo.pronunciation,
        meaning: wordInfo.definitions?.[0]?.meaning || '',
        partOfSpeech: wordInfo.definitions?.[0]?.partOfSpeech || '',
        level: wordData.level
      };
    });

    return NextResponse.json({
      words: reviewWords,
      total: reviewWords.length
    });

  } catch (error) {
    console.error('Widget review API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review words' },
      { status: 500 }
    );
  }
}
