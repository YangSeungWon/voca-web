import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { User, Word, Definition } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';
import { ipaToHangul } from 'ipa-hangul';

/**
 * Widget API: Get today's word for widget display
 * Returns a random word from user's vocabulary
 */
export async function GET(req: NextRequest) {
  try {
    // Support both header-based and JWT auth
    const authHeader = req.headers.get('authorization');
    let userId = req.headers.get('x-user-id') || 'default-user';

    console.log('[Widget API] Request received');
    console.log('[Widget API] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'none');

    // Check JWT token if provided
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
        console.log('[Widget API] JWT verified, userId:', userId);
      } catch (error) {
        console.error('[Widget API] JWT verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    } else {
      console.log('[Widget API] Using fallback userId:', userId);
    }

    // Find or create user
    let user: User | null;
    console.log('[Widget API] Looking up user with userId:', userId);

    if (userId.includes('-')) {
      console.log('[Widget API] Searching by ID');
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else {
      const email = userId.includes('@') ? userId : `${userId}@temp.email`;
      console.log('[Widget API] Searching by email:', email);
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        console.log('[Widget API] User not found, creating new user');
        user = await prisma.user.create({
          data: { email }
        });
      }
    }

    if (!user) {
      console.error('[Widget API] User not found after lookup');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Widget API] User found:', user.id);

    // Get total count of user's words
    const totalWords = await prisma.vocabulary.count({
      where: { userId: user.id }
    });

    if (totalWords === 0) {
      return NextResponse.json({
        word: null,
        message: 'No words in vocabulary yet'
      });
    }

    // Get word by index (from query param) or random
    const indexParam = req.nextUrl.searchParams.get('index');
    let wordIndex: number;

    if (indexParam !== null) {
      wordIndex = parseInt(indexParam) % totalWords;
    } else {
      // Random word for initial load
      wordIndex = Math.floor(Math.random() * totalWords);
    }

    const randomWord = await prisma.vocabulary.findMany({
      where: { userId: user.id },
      include: {
        word: {
          include: {
            definitions: true
          }
        }
      },
      skip: wordIndex,
      take: 1
    });

    if (!randomWord || randomWord.length === 0) {
      return NextResponse.json({
        word: null,
        message: 'No words found'
      });
    }

    const wordData = randomWord[0];
    type WordWithDefinitions = Word & { definitions: Definition[] };
    const wordInfo = wordData.word as WordWithDefinitions;

    // Convert IPA to Hangul
    const ipaText = wordInfo.pronunciation || '';
    const hangulPronunciation = ipaText ? ipaToHangul(ipaText) : '';

    // Return simplified data for widget
    return NextResponse.json({
      word: {
        id: wordData.id,
        text: wordInfo.word,
        pronunciation: ipaText,
        pronunciationKr: hangulPronunciation,
        meaning: wordInfo.definitions?.[0]?.meaning || '',
        partOfSpeech: wordInfo.definitions?.[0]?.partOfSpeech || '',
        level: wordData.level
      },
      index: wordIndex,
      total: totalWords,
      date: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s word' },
      { status: 500 }
    );
  }
}
