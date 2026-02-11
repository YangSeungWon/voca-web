'use client';

import { useState, useEffect, useRef } from 'react';
import { getAuthToken } from '@/lib/auth';
import { speak } from '@/lib/speech';
import { Volume2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { apiFetch } from '@/lib/api-client';
import { formatPronunciation, getHelperText, getEffectiveHelper } from '@/lib/ipa-to-korean';
import { useLocale } from 'next-intl';

interface StudyWord {
  id: string;
  word: {
    word: string;
    pronunciation?: string;
    definitions: {
      partOfSpeech?: string;
      meaning: string;
    }[];
  };
  level: number;
  reviewCount: number;
  correctCount: number;
}

type StudyState = 'ready' | 'question' | 'answer' | 'complete';

export default function StudyMode() {
  const [words, setWords] = useState<StudyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyState, setStudyState] = useState<StudyState>('ready');
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const locale = useLocale();

  // Swipe gestures for mobile
  useSwipeGesture(cardRef, {
    onSwipeLeft: () => {
      if (showAnswer) {
        handleAnswer(false); // Wrong answer
      }
    },
    onSwipeRight: () => {
      if (showAnswer) {
        handleAnswer(true); // Correct answer
      }
    },
    onSwipeUp: () => {
      if (!showAnswer && studyState === 'question') {
        handleShowAnswer();
      }
    }
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: ' ',
      handler: () => {
        if (studyState === 'question' && !showAnswer) {
          setShowAnswer(true);
        }
      },
      description: 'Show answer'
    },
    {
      key: 'ArrowRight',
      handler: () => {
        if (showAnswer) {
          handleAnswer(true);
        }
      },
      description: 'Mark as correct'
    },
    {
      key: 'ArrowLeft', 
      handler: () => {
        if (showAnswer) {
          handleAnswer(false);
        }
      },
      description: 'Mark as incorrect'
    },
    {
      key: 'Enter',
      handler: () => {
        if (studyState === 'complete') {
          window.location.reload();
        }
      },
      description: 'Restart session'
    },
    {
      key: 'p',
      handler: () => {
        const currentWord = words[currentIndex];
        if (currentWord) {
          speak(currentWord.word.word);
        }
      },
      description: 'Pronounce word'
    },
    {
      key: '?',
      shift: true,
      handler: () => {
        setShowShortcuts(!showShortcuts);
      },
      description: 'Toggle shortcuts help'
    }
  ]);

  useEffect(() => {
    loadStudyWords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudyWords = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Prioritize words with lower levels and less recent reviews
      const sortedWords = data.sort((a: StudyWord, b: StudyWord) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.reviewCount - b.reviewCount;
      });
      
      setWords(sortedWords.slice(0, 10)); // Study 10 words per session
      setSessionStats({ ...sessionStats, total: Math.min(sortedWords.length, 10) });
    } catch (error) {
      console.error('Failed to load study words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (words.length > 0) {
      setStudyState('question');
      setCurrentIndex(0);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setStudyState('answer');
  };

  const handleAnswer = async (correct: boolean) => {
    const currentWord = words[currentIndex];
    
    // Update statistics
    setSessionStats(prev => ({
      ...prev,
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: !correct ? prev.incorrect + 1 : prev.incorrect
    }));

    // Update word level in database
    try {
      const token = getAuthToken();
      if (!token) return;

      await apiFetch(`/api/vocabulary/${currentWord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          level: correct ? Math.min(currentWord.level + 1, 5) : Math.max(currentWord.level - 1, 0),
          reviewCount: currentWord.reviewCount + 1,
          correctCount: correct ? currentWord.correctCount + 1 : currentWord.correctCount
        })
      });
    } catch (error) {
      console.error('Failed to update word progress:', error);
    }

    // Move to next word or complete
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setStudyState('question');
    } else {
      setStudyState('complete');
    }
  };

  const getLevelColor = (level: number) => {
    const colors = ['bg-red-100', 'bg-orange-100', 'bg-yellow-100', 'bg-green-100', 'bg-blue-100', 'bg-purple-100'];
    return colors[level] || 'bg-gray-100';
  };

  const getLevelText = (level: number) => {
    const levels = ['New', 'Learning', 'Familiar', 'Known', 'Mastered', 'Expert'];
    return levels[level] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading study materials...</div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 h-[calc(100vh-80px)] pb-24">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No words to study</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">Add some words to your vocabulary first!</div>
        </div>
      </div>
    );
  }

  if (studyState === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center px-6 h-[calc(100vh-80px)] pb-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Ready to Study?</h2>
          <div className="text-base text-gray-600 dark:text-gray-400">
            You have {words.length} words to review today
          </div>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-4 text-lg font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95"
        >
          Start Study Session
        </button>
      </div>
    );
  }

  if (studyState === 'complete') {
    const accuracy = sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center px-6 h-[calc(100vh-80px)] pb-24">
        <div className="text-center w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Session Complete!</h2>

          <div className="mb-8 space-y-2">
            <div className="text-4xl font-bold text-gray-800 dark:text-gray-200">{accuracy}%</div>
            <div className="text-base text-gray-600 dark:text-gray-400">Accuracy</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
              <div className="text-3xl font-semibold text-green-600 dark:text-green-400">{sessionStats.correct}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Correct</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
              <div className="text-3xl font-semibold text-red-600 dark:text-red-400">{sessionStats.incorrect}</div>
              <div className="text-sm text-red-600 dark:text-red-400">Incorrect</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <div className="text-3xl font-semibold text-gray-600 dark:text-gray-400">{sessionStats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 text-lg font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95"
          >
            Study Again
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 pb-24">
      {/* Keyboard Shortcuts Help */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className="fixed bottom-24 right-4 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 z-50 md:hidden"
        title="Keyboard shortcuts"
      >
        <Info size={20} />
      </button>
      
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Show answer:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mark correct:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">→</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mark incorrect:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">←</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pronounce:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">P</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Start/Restart:</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">Enter</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full py-2 bg-gray-600 dark:bg-gray-600 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>Word {currentIndex + 1} of {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full min-h-0">
        <div
          ref={cardRef}
          className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col relative overflow-hidden"
        >
          {/* Swipe Hints for Mobile */}
          <div className="md:hidden flex justify-between text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <ChevronLeft size={14} />
              Wrong
            </span>
            <span>Swipe up to reveal</span>
            <span className="flex items-center gap-1">
              Correct
              <ChevronRight size={14} />
            </span>
          </div>

          {/* Word Level Badge */}
          <div className="mb-3 flex justify-center">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getLevelColor(currentWord.level)}`}>
              {getLevelText(currentWord.level)}
            </span>
          </div>

          {/* Question Side */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {currentWord.word.word}
              </h3>
              <button
                onClick={() => speak(currentWord.word.word, 0.7)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Pronounce"
              >
                <Volume2 size={20} />
              </button>
            </div>
            {currentWord.word.pronunciation && (() => {
              const { korean, katakana, ipa } = formatPronunciation(currentWord.word.pronunciation);
              const helper = getEffectiveHelper(locale);
              const helperText = getHelperText(currentWord.word.pronunciation, locale, { korean, katakana });
              return (
                <div className="flex items-center justify-center gap-2 mt-2 pt-2">
                  {helper !== 'off' && helperText && (
                    <span
                      className="text-xl font-medium text-gray-600 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: `[${helperText}]` }}
                    />
                  )}
                  <span className="text-xl text-gray-500">{ipa}</span>
                </div>
              );
            })()}
          </div>

          {/* Answer Side - Scrollable */}
          {showAnswer && (
            <div className="flex-1 border-t pt-4 overflow-y-auto min-h-0 animate-fadeIn">
              <div className="space-y-2">
                {currentWord.word.definitions.map((def, index) => (
                  <div key={index} className="text-left">
                    {def.partOfSpeech && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full mr-2">
                        {def.partOfSpeech}
                      </span>
                    )}
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{def.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="mt-4 flex justify-center gap-4 shrink-0">
          {!showAnswer ? (
            <button
              onClick={handleShowAnswer}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Show Answer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 max-w-[150px] py-3 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 max-w-[150px] py-3 bg-green-500 text-white rounded-xl hover:bg-green-600"
              >
                Correct
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}