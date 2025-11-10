'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserId } from '@/lib/auth';
import { speak } from '@/lib/speech';
import { Volume2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { apiFetch } from '@/lib/api-client';
import { formatPronunciation } from '@/lib/ipa-to-korean';

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
      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'x-user-id': getUserId()
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
      await apiFetch(`/api/vocabulary/${currentWord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
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
      <div className="p-8 text-center">
        <div className="text-gray-500 mb-4">No words to study</div>
        <div className="text-sm text-gray-400">Add some words to your vocabulary first!</div>
      </div>
    );
  }

  if (studyState === 'ready') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Ready to Study?</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          You have {words.length} words to review today
        </div>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-gray-800 text-white rounded-sm hover:bg-gray-700"
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
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Session Complete!</h2>
        
        <div className="mb-6 space-y-2">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{accuracy}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
          <div className="bg-green-50 p-3 rounded-sm">
            <div className="text-2xl font-semibold text-green-600">{sessionStats.correct}</div>
            <div className="text-xs text-green-600">Correct</div>
          </div>
          <div className="bg-red-50 p-3 rounded-sm">
            <div className="text-2xl font-semibold text-red-600">{sessionStats.incorrect}</div>
            <div className="text-xs text-red-600">Incorrect</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-sm">
            <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{sessionStats.total}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gray-800 text-white rounded-sm hover:bg-gray-700"
        >
          Study Again
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="p-6">
      {/* Keyboard Shortcuts Help */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 z-50 md:hidden"
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
              className="mt-4 w-full py-2 bg-gray-800 dark:bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-500"
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
        <div className="h-2 bg-gray-200 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-gray-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-2xl mx-auto">
        <div 
          ref={cardRef}
          className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-sm p-8 min-h-[300px] flex flex-col justify-center relative"
        >
          {/* Swipe Hints for Mobile */}
          <div className="md:hidden absolute top-4 left-4 right-4 flex justify-between text-xs text-gray-400">
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
          <div className="mb-4 flex justify-center">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getLevelColor(currentWord.level)}`}>
              {getLevelText(currentWord.level)}
            </span>
          </div>

          {/* Question Side */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
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
              const { korean, ipa } = formatPronunciation(currentWord.word.pronunciation);
              return (
                <div className="flex items-center justify-center gap-3 mt-2">
                  {korean && (
                    <span
                      className="text-2xl font-medium text-blue-600 dark:text-blue-400"
                      dangerouslySetInnerHTML={{ __html: `[${korean}]` }}
                    />
                  )}
                  <span className="text-2xl text-gray-500">{ipa}</span>
                </div>
              );
            })()}
          </div>

          {/* Answer Side */}
          {showAnswer && (
            <div className="border-t pt-6 space-y-3 animate-fadeIn">
              {currentWord.word.definitions.map((def, index) => (
                <div key={index} className="text-left">
                  {def.partOfSpeech && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-sm mr-2">
                      {def.partOfSpeech}
                    </span>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">{def.meaning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          {!showAnswer ? (
            <button
              onClick={handleShowAnswer}
              className="px-8 py-3 bg-gray-800 text-white rounded-sm hover:bg-gray-700"
            >
              Show Answer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAnswer(false)}
                className="px-6 py-3 bg-red-500 text-white rounded-sm hover:bg-red-600"
              >
                Incorrect
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="px-6 py-3 bg-green-500 text-white rounded-sm hover:bg-green-600"
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