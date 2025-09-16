'use client';

import { useState } from 'react';
import { Trash2, Volume2, ChevronRight, Folder } from 'lucide-react';
import { speak } from '@/lib/speech';
import ExampleSentences from './ExampleSentences';

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

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-3">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {item.word.word}
              </h3>
              {item.word.pronunciation && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.word.pronunciation}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {item.word.definitions[0]?.meaning || '-'}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {item.word.definitions[0]?.partOfSpeech && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {item.word.definitions[0].partOfSpeech}
                </span>
              )}
              <span>Level {item.level}</span>
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
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            size={20}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(item.word.word);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Volume2 size={16} />
              Pronounce
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
          
          {item.word.definitions.length > 1 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Other Definitions:
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