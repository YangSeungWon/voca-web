'use client';

import { useState, useEffect } from 'react';
import { Check, Save, Volume2, Folder } from 'lucide-react';
import { DictionaryEntry } from '@/lib/dictionary';
import { getUserId } from '@/lib/auth';
import { speak } from '@/lib/speech';
import { apiFetch } from '@/lib/api-client';
import { formatPronunciation } from '@/lib/ipa-to-korean';

interface WordDisplayProps {
  word: DictionaryEntry;
  onSave?: () => void;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

export default function WordDisplay({ word, onSave }: WordDisplayProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await apiFetch('/api/groups', {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiFetch('/api/vocabulary', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({ 
          word: word.word,
          groupId: selectedGroup 
        }),
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
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dictionary Result</h3>
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowGroupSelector(!showGroupSelector)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-sm flex items-center gap-1 hover:bg-gray-100"
              >
                <Folder size={12} />
                {selectedGroup ? (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-sm" 
                      style={{ backgroundColor: groups.find(g => g.id === selectedGroup)?.color }}
                    />
                    {groups.find(g => g.id === selectedGroup)?.name}
                  </div>
                ) : (
                  'No Group'
                )}
              </button>
              {showGroupSelector && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-sm shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedGroup(null);
                      setShowGroupSelector(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100"
                  >
                    No Group
                  </button>
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroup(group.id);
                        setShowGroupSelector(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2"
                    >
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 break-words">{word.word}</span>
            <button
              onClick={() => speak(word.word)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors flex-shrink-0"
              title="Pronounce"
            >
              <Volume2 size={16} />
            </button>
          </div>
          {word.pronunciation && (() => {
            const { korean, ipa } = formatPronunciation(word.pronunciation);
            return (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                {korean && (
                  <span
                    className="text-lg sm:text-2xl font-medium text-blue-600 dark:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: `[${korean}]` }}
                  />
                )}
                <span className="text-lg sm:text-2xl text-gray-500">{ipa}</span>
              </div>
            );
          })()}
        </div>

        <div className="space-y-2">
          {word.definitions.map((def, index) => (
            <div key={index} className="border-l-2 border-gray-200 pl-3">
              <div className="flex items-start gap-2">
                {def.partOfSpeech && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-sm">
                    {def.partOfSpeech}
                  </span>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{def.meaning}</p>
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