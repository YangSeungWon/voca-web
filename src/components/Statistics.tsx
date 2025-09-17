'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Award, Brain } from 'lucide-react';
import { getUserId } from '@/lib/auth';

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
      const response = await fetch('/api/statistics', {
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
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">No statistics available</div>
      </div>
    );
  }

  const maxDailyValue = Math.max(
    ...stats.dailyProgress.map(d => Math.max(d.added, d.reviewed)),
    1
  );

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <Brain className="text-gray-400" size={20} />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.overview.total}</div>
          <div className="text-xs text-gray-500 mt-1">words in library</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-500" size={20} />
            <span className="text-xs text-gray-500">This Week</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.overview.week}</div>
          <div className="text-xs text-gray-500 mt-1">words added</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-yellow-500" size={20} />
            <span className="text-xs text-gray-500">Mastered</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.overview.mastered}</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.overview.total > 0 
              ? `${Math.round((stats.overview.mastered / stats.overview.total) * 100)}% complete`
              : 'start learning'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-blue-500" size={20} />
            <span className="text-xs text-gray-500">Streak</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.overview.streak}</div>
          <div className="text-xs text-gray-500 mt-1">days in a row</div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Activity (Last 30 Days)</h3>
        <div className="h-32 flex items-end gap-1">
          {stats.dailyProgress.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col gap-1 items-center">
              <div className="w-full flex flex-col gap-0.5" style={{ height: '120px' }}>
                <div 
                  className="bg-green-400 dark:bg-green-500 rounded-sm transition-all hover:bg-green-500 dark:hover:bg-green-400"
                  style={{ 
                    flex: day.reviewed / maxDailyValue || 0.01,
                    minHeight: day.reviewed > 0 ? '2px' : '0'
                  }}
                  title={`${day.date}: ${day.reviewed} reviewed`}
                />
                <div 
                  className="bg-blue-400 dark:bg-blue-500 rounded-sm transition-all hover:bg-blue-500 dark:hover:bg-blue-400"
                  style={{ 
                    flex: day.added / maxDailyValue || 0.01,
                    minHeight: day.added > 0 ? '2px' : '0'
                  }}
                  title={`${day.date}: ${day.added} added`}
                />
                <div 
                  className="flex-1"
                  style={{ 
                    flex: 1 - (day.added + day.reviewed) / maxDailyValue
                  }}
                />
              </div>
              {(index % 5 === 0 || index === stats.dailyProgress.length - 1) && (
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(day.date).getDate()}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 dark:bg-blue-500 rounded-sm"></div>
            <span className="text-gray-600 dark:text-gray-400">Added</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 dark:bg-green-500 rounded-sm"></div>
            <span className="text-gray-600 dark:text-gray-400">Reviewed</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Level Distribution */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Mastery Levels</h3>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map(level => {
              const count = stats.levelDistribution[level] || 0;
              const percentage = stats.overview.total > 0 
                ? (count / stats.overview.total) * 100 
                : 0;
              const levelNames = ['New', 'Learning', 'Familiar', 'Known', 'Mastered', 'Expert'];
              const levelColors = [
                'bg-red-200 dark:bg-red-600',
                'bg-orange-200 dark:bg-orange-600',
                'bg-yellow-200 dark:bg-yellow-600',
                'bg-green-200 dark:bg-green-600',
                'bg-blue-200 dark:bg-blue-600',
                'bg-purple-200 dark:bg-purple-600'
              ];
              
              return (
                <div key={level}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{levelNames[level]}</span>
                    <span className="text-gray-500">{count} words</span>
                  </div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden">
                    <div 
                      className={`h-full ${levelColors[level]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficult Words */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Most Challenging Words</h3>
          {stats.difficultWords.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4">
              No review data yet. Start studying to see your challenging words!
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.difficultWords.map((word, index) => (
                <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{word.word}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{word.reviews} reviews</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      word.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                      word.accuracy >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(word.accuracy)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Summary */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold mb-1">Study Progress</h3>
            <div className="text-xs opacity-90">
              Keep up the great work! You&apos;ve learned {stats.overview.mastered} words so far.
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {stats.overview.total > 0 
                ? Math.round((stats.overview.mastered / stats.overview.total) * 100)
                : 0}%
            </div>
            <div className="text-xs opacity-90">Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}