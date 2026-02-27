'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useOfflineVocabulary } from '@/hooks/useOfflineVocabulary';

interface Statistics {
  overview: {
    total: number;
    today: number;
    week: number;
    month: number;
    mastered: number;
    learning: number;
    new: number;
    streak: number;
  };
  levelDistribution: Record<number, number>;
  dailyProgress: Array<{
    date: string;
    added: number;
    reviewed: number;
  }>;
  difficultWords: Array<{
    word: string;
    accuracy: number;
    reviews: number;
  }>;
}

export default function Statistics() {
  const t = useTranslations('stats');
  const { vocabulary, loading } = useOfflineVocabulary();

  // Compute statistics from vocabulary
  const stats = useMemo<Statistics | null>(() => {
    if (vocabulary.length === 0) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count words by time period
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let masteredCount = 0;
    let learningCount = 0;
    let newCount = 0;

    const levelDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const dailyMap: Record<string, { added: number; reviewed: number }> = {};

    vocabulary.forEach(word => {
      const createdAt = new Date(word.createdAt);

      // Time period counts
      if (createdAt >= today) todayCount++;
      if (createdAt >= weekAgo) weekCount++;
      if (createdAt >= monthAgo) monthCount++;

      // Level counts
      if (word.level >= 4) masteredCount++;
      else if (word.level >= 1) learningCount++;
      else newCount++;

      // Level distribution
      levelDistribution[word.level] = (levelDistribution[word.level] || 0) + 1;

      // Daily progress (last 7 days)
      const dateKey = createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { added: 0, reviewed: 0 };
      }
      dailyMap[dateKey].added++;
      if (word.reviewCount > 0) {
        dailyMap[dateKey].reviewed += word.reviewCount;
      }
    });

    // Generate last 7 days of progress
    const dailyProgress: Array<{ date: string; added: number; reviewed: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyProgress.push({
        date: dateKey,
        added: dailyMap[dateKey]?.added || 0,
        reviewed: dailyMap[dateKey]?.reviewed || 0
      });
    }

    // Calculate streak (consecutive days with activity)
    let streak = 0;
    for (let i = dailyProgress.length - 1; i >= 0; i--) {
      if (dailyProgress[i].added > 0 || dailyProgress[i].reviewed > 0) {
        streak++;
      } else if (i < dailyProgress.length - 1) {
        // Allow today to be empty, break on past empty days
        break;
      }
    }

    return {
      overview: {
        total: vocabulary.length,
        today: todayCount,
        week: weekCount,
        month: monthCount,
        mastered: masteredCount,
        learning: learningCount,
        new: newCount,
        streak
      },
      levelDistribution,
      dailyProgress,
      difficultWords: []
    };
  }, [vocabulary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-gray-400">{t('loading')}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-gray-400">{t('noData')}</div>
      </div>
    );
  }

  const progressPercent = stats.overview.total > 0
    ? Math.round((stats.overview.mastered / stats.overview.total) * 100)
    : 0;

  const levelNames = [t('levelNew'), t('levelLearning'), t('levelFamiliar'), t('levelKnown'), t('levelMastered'), t('levelExpert')];
  const levelEmojis = ['🆕', '📖', '💡', '✅', '⭐', '👑'];
  const levelColors = [
    'from-red-400 to-red-500',
    'from-orange-400 to-orange-500',
    'from-yellow-400 to-yellow-500',
    'from-green-400 to-green-500',
    'from-blue-400 to-blue-500',
    'from-purple-400 to-purple-500'
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card - Total & Progress */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-blue-100 text-sm mb-1">{t('totalWords')}</div>
            <div className="text-5xl font-bold">{stats.overview.total}</div>
            {stats.overview.week > 0 && (
              <div className="text-blue-100 text-sm mt-2">
                {t('thisWeek', { count: stats.overview.week })}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="white"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.14} 214`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{progressPercent}%</span>
              </div>
            </div>
            <div className="text-blue-100 text-xs mt-1">{t('mastered')}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overview.streak}</div>
          <div className="text-xs text-gray-500">{t('dayStreak')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overview.today}</div>
          <div className="text-xs text-gray-500">{t('today')}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overview.mastered}</div>
          <div className="text-xs text-gray-500">{t('mastered')}</div>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">{t('progressByLevel')}</h3>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map(level => {
            const count = stats.levelDistribution[level] || 0;
            const percentage = stats.overview.total > 0
              ? (count / stats.overview.total) * 100
              : 0;

            return (
              <div key={level} className="flex items-center gap-3">
                <span className="text-lg w-8">{levelEmojis[level]}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{levelNames[level]}</span>
                    <span className="text-gray-500 font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${levelColors[level]} transition-all duration-700 rounded-full`}
                      style={{ width: `${Math.max(percentage, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">{t('last7Days')}</h3>
        <div className="flex items-end justify-between gap-2 h-24">
          {stats.dailyProgress.slice(-7).map((day, index) => {
            const maxVal = Math.max(...stats.dailyProgress.slice(-7).map(d => d.added + d.reviewed), 1);
            const height = ((day.added + day.reviewed) / maxVal) * 100;
            const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).charAt(0);
            const isToday = index === stats.dailyProgress.slice(-7).length - 1;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-16">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                        : 'bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500'
                    }`}
                    style={{ height: `${Math.max(height, day.added + day.reviewed > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className={`text-xs ${isToday ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
          <span>📝 {t('added')}: {stats.dailyProgress.slice(-7).reduce((a, b) => a + b.added, 0)}</span>
          <span>📚 {t('reviewed')}: {stats.dailyProgress.slice(-7).reduce((a, b) => a + b.reviewed, 0)}</span>
        </div>
      </div>

      {/* Encouragement */}
      {stats.overview.total > 0 && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">
            {progressPercent >= 80 ? '🏆' : progressPercent >= 50 ? '💪' : progressPercent >= 20 ? '📈' : '🌱'}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {progressPercent >= 80
              ? t('encouragement.master')
              : progressPercent >= 50
              ? t('encouragement.great')
              : progressPercent >= 20
              ? t('encouragement.onWay')
              : t('encouragement.started')}
          </div>
        </div>
      )}
    </div>
  );
}
