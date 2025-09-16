'use client';

import { useState } from 'react';
import { Check, Save, Volume2 } from 'lucide-react';
import { DictionaryEntry } from '@/lib/dictionary';
import { getUserId } from '@/lib/auth';
import { speak } from '@/lib/speech';

interface WordDisplayProps {
  word: DictionaryEntry;
  onSave?: () => void;
}

export default function WordDisplay({ word, onSave }: WordDisplayProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({ word: word.word }),
      });

      if (response.ok) {
        setIsSaved(true);
        onSave?.();
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Dictionary Result</h3>
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className={`
            px-3 py-1 text-xs rounded-sm flex items-center gap-1 transition-colors
            ${isSaved 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isSaved ? (
            <>
              <Check size={12} />
              Saved
            </>
          ) : (
            <>
              <Save size={12} />
              Add to List
            </>
          )}
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-800">{word.word}</span>
            {word.pronunciation && (
              <span className="text-sm text-gray-500">{word.pronunciation}</span>
            )}
            <button
              onClick={() => speak(word.word)}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-colors"
              title="Pronounce"
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {word.definitions.map((def, index) => (
            <div key={index} className="border-l-2 border-gray-200 pl-3">
              <div className="flex items-start gap-2">
                {def.partOfSpeech && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-sm">
                    {def.partOfSpeech}
                  </span>
                )}
                <p className="text-sm text-gray-700 flex-1">{def.meaning}</p>
              </div>
              {def.examples && def.examples.length > 0 && (
                <div className="mt-1 ml-12">
                  {def.examples.map((example, i) => (
                    <p key={i} className="text-xs text-gray-500 italic">
                      Example: {example}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}