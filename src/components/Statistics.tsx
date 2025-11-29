'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

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
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await apiFetch('/api/statistics', {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-gray-400">No data available</div>
      </div>
    );
  }

  const progressPercent = stats.overview.total > 0
    ? Math.round((stats.overview.mastered / stats.overview.total) * 100)
    : 0;

  const levelNames = ['New', 'Learning', 'Familiar', 'Known', 'Mastered', 'Expert'];
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
            <div className="text-blue-100 text-sm mb-1">Total Words</div>
            <div className="text-5xl font-bold">{stats.overview.total}</div>
            {stats.overview.week > 0 && (
              <div className="text-blue-100 text-sm mt-2">
                +{stats.overview.week} this week
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
            <div className="text-blue-100 text-xs mt-1">Mastered</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overview.streak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overview.today}</div>
          <div className="text-xs text-gray-500">Today</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.overview.mastered}</div>
          <div className="text-xs text-gray-500">Mastered</div>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Progress by Level</h3>
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
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Last 7 Days</h3>
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
          <span>📝 Added: {stats.dailyProgress.slice(-7).reduce((a, b) => a + b.added, 0)}</span>
          <span>📚 Reviewed: {stats.dailyProgress.slice(-7).reduce((a, b) => a + b.reviewed, 0)}</span>
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
              ? "Amazing! You're a vocabulary master!"
              : progressPercent >= 50
              ? "Great progress! Keep it up!"
              : progressPercent >= 20
              ? "You're on your way! Keep learning!"
              : "Just getting started. Every word counts!"}
          </div>
        </div>
      )}
    </div>
  );
}
