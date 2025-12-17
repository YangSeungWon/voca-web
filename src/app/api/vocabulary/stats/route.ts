import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    // JWT authentication required
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let authenticatedUserId: string;
    try {
      const payload = verifyToken(token);
      authenticatedUserId = payload.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get total word count
    const total = await prisma.vocabulary.count({
      where: { userId: authenticatedUserId }
    });

    // Get today's added words
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAdded = await prisma.vocabulary.count({
      where: {
        userId: authenticatedUserId,
        createdAt: {
          gte: today
        }
      }
    });

    // Get words by level
    const wordsByLevel = await prisma.vocabulary.groupBy({
      by: ['level'],
      where: { userId: authenticatedUserId },
      _count: {
        level: true
      }
    });

    // Get review stats
    const needReview = await prisma.vocabulary.count({
      where: {
        userId: authenticatedUserId,
        nextReview: {
          lte: new Date()
        }
      }
    });

    // Format level stats
    const levels = {
      new: 0,
      learning: 0,
      familiar: 0,
      known: 0,
      mastered: 0
    };
    
    wordsByLevel.forEach(item => {
      switch(item.level) {
        case 0: levels.new = item._count.level; break;
        case 1: levels.learning = item._count.level; break;
        case 2: levels.familiar = item._count.level; break;
        case 3: levels.known = item._count.level; break;
        case 4:
        case 5: levels.mastered += item._count.level; break;
      }
    });

    return NextResponse.json({
      total,
      todayAdded,
      needReview,
      levels
    });
  } catch (error) {
    console.error('Failed to get vocabulary stats:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}