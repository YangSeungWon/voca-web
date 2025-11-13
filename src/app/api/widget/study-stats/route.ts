import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * Widget API: Get today's study statistics
 * Returns number of study sessions and words reviewed today
 */
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
      } catch (error) {
        console.error('[Widget Study Stats] JWT verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    // Find or create user
    let user;
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
