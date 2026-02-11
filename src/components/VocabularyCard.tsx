'use client';

import { useState } from 'react';
import { Trash2, Volume2, ChevronRight } from 'lucide-react';
import { speak } from '@/lib/speech';
import ExampleSentences from './ExampleSentences';
import ConfirmModal from './ConfirmModal';
import { formatPronunciation, getHelperText, getEffectiveHelper } from '@/lib/ipa-to-korean';
import { useLocale } from 'next-intl';

interface VocabularyWord {
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
  createdAt: string;
  notes?: string;
}

interface VocabularyCardProps {
  item: VocabularyWord;
  onDelete: (id: string) => void;
}

export default function VocabularyCard({ item, onDelete }: VocabularyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const locale = useLocale();

  const { korean, katakana, ipa } = item.word.pronunciation
    ? formatPronunciation(item.word.pronunciation)
    : { korean: '', katakana: '', ipa: '' };

  const helper = getEffectiveHelper(locale);
  const helperText = getHelperText(item.word.pronunciation, locale, { korean, katakana });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-2">
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-0.5">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 break-all">
                {item.word.word}
              </h3>
              {ipa && (
                <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 pt-1">
                  {helper !== 'off' && helperText ? (
                    <>
                      <span
                        className="font-medium"
                        dangerouslySetInnerHTML={{ __html: `[${helperText}]` }}
                      />
                      <span className="ml-1">{ipa}</span>
                    </>
                  ) : (
                    ipa
                  )}
                </span>
              )}
            </div>

            <p className={`text-sm text-gray-600 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-1'}`}>
              {item.word.definitions[0]?.meaning || '-'}
            </p>

            {item.word.definitions[0]?.partOfSpeech && (
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {item.word.definitions[0].partOfSpeech}
                </span>
              </div>
            )}
          </div>

          <ChevronRight
            className={`text-gray-300 dark:text-gray-600 transition-transform ml-2 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            size={18}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          {/* Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-400">Level {item.level}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(item.word.word);
                }}
                className="p-2 bg-blue-600 text-white rounded-lg"
              >
                <Volume2 size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-2 bg-red-500 text-white rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {item.word.definitions.length > 1 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Other Definitions
              </h4>
              <div className="space-y-1">
                {item.word.definitions.slice(1).map((def, idx) => (
                  <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    {def.partOfSpeech && (
                      <span className="font-medium">{def.partOfSpeech}: </span>
                    )}
                    {def.meaning}
                  </div>
                ))}
              </div>
            </div>
          )}

          <ExampleSentences wordId={item.id} wordText={item.word.word} />
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Word"
        message={`Are you sure you want to delete "${item.word.word}" from your vocabulary?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          onDelete(item.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}