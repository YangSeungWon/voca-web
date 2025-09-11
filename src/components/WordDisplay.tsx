'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { DictionaryEntry } from '@/lib/dictionary';
import { getUserId } from '@/lib/auth';

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
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-medium">{word.word}</h2>
          {word.pronunciation && (
            <p className="text-sm text-gray-500 mt-1">{word.pronunciation}</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className={`
            p-2 rounded-lg transition-all
            ${isSaved 
              ? 'bg-green-100 text-green-600' 
              : 'bg-white hover:bg-gray-100 text-gray-600'
            }
            disabled:opacity-50
          `}
        >
          {isSaved ? <Check size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <div className="space-y-3">
        {word.definitions.map((def, index) => (
          <div key={index} className="space-y-2">
            {def.partOfSpeech && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 rounded">
                {def.partOfSpeech}
              </span>
            )}
            <p className="text-gray-700">{def.meaning}</p>
            {def.examples && def.examples.length > 0 && (
              <div className="pl-4 border-l-2 border-gray-200">
                {def.examples.map((example, i) => (
                  <p key={i} className="text-sm text-gray-600 italic">
                    "{example}"
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}