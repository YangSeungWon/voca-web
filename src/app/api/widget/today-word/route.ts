import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Widget API: Get today's word for widget display
 * Returns a random word from user's vocabulary
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'default-user';

    // Find or create user
    let user: any;
    if (userId.includes('-')) {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else {
      const email = userId.includes('@') ? userId : `${userId}@temp.email`;
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: { email }
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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

    // Get a random word using deterministic seed based on today's date
    // This ensures the same "today's word" throughout the day
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const randomIndex = seed % totalWords;

    const randomWord = await prisma.vocabulary.findMany({
      where: { userId: user.id },
      include: {
        word: true
      },
      skip: randomIndex,
      take: 1
    });

    if (!randomWord || randomWord.length === 0) {
      return NextResponse.json({
        word: null,
        message: 'No words found'
      });
    }

    const wordData = randomWord[0];
    const wordInfo = wordData.word as any;

    // Return simplified data for widget
    return NextResponse.json({
      word: {
        text: wordInfo.word,
        pronunciation: wordInfo.pronunciation,
        meaning: wordInfo.definitions?.[0]?.meaning || '',
        partOfSpeech: wordInfo.definitions?.[0]?.partOfSpeech || '',
        level: wordData.level
      },
      date: today.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s word' },
      { status: 500 }
    );
  }
}
