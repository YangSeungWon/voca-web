'use client';

import { useState } from 'react';
import { Trash2, Volume2, ChevronRight } from 'lucide-react';
import { speak } from '@/lib/speech';
import ExampleSentences from './ExampleSentences';
import { formatPronunciation } from '@/lib/ipa-to-korean';

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
  group?: {
    id: string;
    name: string;
    color: string;
  };
}

interface VocabularyCardProps {
  item: VocabularyWord;
  onDelete: (id: string) => void;
}

export default function VocabularyCard({ item, onDelete }: VocabularyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { korean, ipa } = item.word.pronunciation
    ? formatPronunciation(item.word.pronunciation)
    : { korean: '', ipa: '' };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-2">
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                {item.word.word}
              </h3>
              {korean && (
                <span
                  className="text-base font-medium text-blue-500 dark:text-blue-400 shrink-0"
                  dangerouslySetInnerHTML={{ __html: `[${korean}]` }}
                />
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
              {item.word.definitions[0]?.meaning || '-'}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
              {item.word.definitions[0]?.partOfSpeech && (
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {item.word.definitions[0].partOfSpeech}
                </span>
              )}
              {item.group && (
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.group.color }}
                  />
                  <span>{item.group.name}</span>
                </div>
              )}
            </div>
          </div>

          <ChevronRight
            className={`text-gray-300 dark:text-gray-600 transition-transform ml-2 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            size={18}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          {/* IPA & Actions */}
          <div className="flex items-center justify-between mb-3">
            {ipa && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{ipa}</span>
            )}
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
                  onDelete(item.id);
                }}
                className="p-2 bg-red-500 text-white rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Level indicator */}
          <div className="text-xs text-gray-400 mb-3">
            Level {item.level}
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
    </div>
  );
}