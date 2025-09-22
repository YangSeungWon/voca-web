'use client';

import { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserId } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

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

export default function VocabularyList() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWords(data);
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiFetch(`/api/vocabulary/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        setWords(words.filter(w => w.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedWords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWords(newExpanded);
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        Loading vocabulary...
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No words in your vocabulary yet.</p>
        <p className="text-sm mt-2">Start by searching and adding words!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {words.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{item.word.word}</h3>
                {item.word.pronunciation && (
                  <span className="text-sm text-gray-500">
                    {item.word.pronunciation}
                  </span>
                )}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {expandedWords.has(item.id) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
              
              {!expandedWords.has(item.id) ? (
                <p className="text-sm text-gray-600 mt-1">
                  {item.word.definitions[0]?.meaning}
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {item.word.definitions.map((def, index) => (
                    <div key={index} className="text-sm">
                      {def.partOfSpeech && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded mr-2">
                          {def.partOfSpeech}
                        </span>
                      )}
                      <span className="text-gray-700">{def.meaning}</span>
                    </div>
                  ))}
                  {item.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-gray-600">
                      {item.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>Level {item.level}</span>
            <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}