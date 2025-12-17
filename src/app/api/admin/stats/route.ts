import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalUsers,
      totalWords,
      totalFeedback,
      todayUsers,
      todayWords,
      weekUsers,
      feedbackByType,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vocabulary.count(),
      prisma.feedback.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.vocabulary.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.feedback.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        today: todayUsers,
        thisWeek: weekUsers,
      },
      words: {
        total: totalWords,
        today: todayWords,
      },
      feedback: {
        total: totalFeedback,
        byType: feedbackByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
