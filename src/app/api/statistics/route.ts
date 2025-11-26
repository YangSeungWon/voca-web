import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Find or create user
    let user: User | null;
    if (userId.includes('-')) {
      // It's a user ID
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else {
      // It's an email or legacy username
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all vocabulary for the user
    const vocabulary = await prisma.vocabulary.findMany({
      where: { userId: user.id },
      include: { word: true },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Words added statistics
    const todayWords = vocabulary.filter(v => new Date(v.createdAt) >= today).length;
    const weekWords = vocabulary.filter(v => new Date(v.createdAt) >= weekAgo).length;
    const monthWords = vocabulary.filter(v => new Date(v.createdAt) >= monthAgo).length;
    const totalWords = vocabulary.length;

    // Level distribution
    const levelDistribution = {
      0: vocabulary.filter(v => v.level === 0).length,
      1: vocabulary.filter(v => v.level === 1).length,
      2: vocabulary.filter(v => v.level === 2).length,
      3: vocabulary.filter(v => v.level === 3).length,
      4: vocabulary.filter(v => v.level === 4).length,
      5: vocabulary.filter(v => v.level === 5).length,
    };

    // Mastery stats
    const masteredWords = vocabulary.filter(v => v.level >= 4).length;
    const learningWords = vocabulary.filter(v => v.level > 0 && v.level < 4).length;
    const newWords = vocabulary.filter(v => v.level === 0).length;

    // Daily progress for last 30 days
    const dailyProgress = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const addedCount = vocabulary.filter(v => {
        const createdAt = new Date(v.createdAt);
        return createdAt >= date && createdAt < nextDate;
      }).length;
      
      const reviewedCount = vocabulary.filter(v => {
        if (!v.lastReviewed) return false;
        const reviewedAt = new Date(v.lastReviewed);
        return reviewedAt >= date && reviewedAt < nextDate;
      }).length;

      dailyProgress.push({
        date: date.toISOString().split('T')[0],
        added: addedCount,
        reviewed: reviewedCount
      });
    }

    // Most difficult words (lowest accuracy)
    const difficultWords = vocabulary
      .filter(v => v.reviewCount > 0)
      .map(v => ({
        word: v.word.word,
        accuracy: v.reviewCount > 0 ? (v.correctCount / v.reviewCount) * 100 : 0,
        reviews: v.reviewCount
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);

    // Study streak calculation
    let streak = 0;
    let checkDate = new Date(today);
    let maxDaysToCheck = 365; // Prevent infinite loop
    
    while (maxDaysToCheck > 0) {
      const dayStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayActivity = vocabulary.some(v => {
        if (v.lastReviewed) {
          const reviewed = new Date(v.lastReviewed);
          return reviewed >= dayStart && reviewed < dayEnd;
        }
        const created = new Date(v.createdAt);
        return created >= dayStart && created < dayEnd;
      });
      
      if (!dayActivity) {
        if (checkDate.getTime() === today.getTime()) {
          // Today has no activity yet, check yesterday
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
          continue;
        }
        break;
      }
      
      streak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      maxDaysToCheck--;
    }

    return NextResponse.json({
      overview: {
        total: totalWords,
        today: todayWords,
        week: weekWords,
        month: monthWords,
        mastered: masteredWords,
        learning: learningWords,
        new: newWords,
        streak
      },
      levelDistribution,
      dailyProgress,
      difficultWords
    });

  } catch (error) {
    console.error('Statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}