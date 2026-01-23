import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/jwt';

/**
 * Widget API: Get today's study statistics
 * Returns number of study sessions and words reviewed today
 */
export async function GET(req: NextRequest) {
  try {
    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = payload.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Count today's study sessions
    const todaySessions = await prisma.studySession.count({
      where: {
        userId: user.id,
        startedAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });

    // Count words studied today (from vocabulary lastReviewed)
    const wordsStudiedToday = await prisma.vocabulary.count({
      where: {
        userId: user.id,
        lastReviewed: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });

    return NextResponse.json({
      sessions: todaySessions,
      wordsStudied: wordsStudiedToday,
      date: now.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Widget study stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study stats' },
      { status: 500 }
    );
  }
}
