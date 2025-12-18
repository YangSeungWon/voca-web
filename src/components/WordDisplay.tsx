'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Save, Volume2, Folder } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DictionaryEntry } from '@/lib/dictionary';
import { getAuthToken } from '@/lib/auth';
import { speak } from '@/lib/speech';
import { apiFetch } from '@/lib/api-client';
import { formatPronunciation } from '@/lib/ipa-to-korean';
import { useAuth } from '@/hooks/useAuth';
import { useVocabularyCache } from '@/hooks/useVocabularyCache';

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
  const t = useTranslations('home');
  const tVocab = useTranslations('vocabulary');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { hasWord, addWord } = useVocabularyCache();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  const alreadyInList = hasWord(word.word);

  useEffect(() => {
    fetchGroups();
  }, []);

  // Reset saved state when word changes
  useEffect(() => {
    setIsSaved(false);
  }, [word.word]);

  const fetchGroups = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await apiFetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
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
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    setIsSaving(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await apiFetch('/api/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          word: word.word,
          groupId: selectedGroup
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        addWord(word.word); // Add to local cache
        onSave?.();
      }
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white break-words">
                {word.word}
              </h2>
              {word.pronunciation && (() => {
                const { korean, ipa } = formatPronunciation(word.pronunciation);
                return (
                  <div className="mt-2 flex flex-col gap-1 pt-2">
                    {korean && (
                      <span
                        className="text-xl sm:text-2xl font-medium text-gray-600 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: `[${korean}]` }}
                      />
                    )}
                    <span className="text-lg sm:text-xl text-gray-500 dark:text-gray-400">{ipa}</span>
                  </div>
                );
              })()}
            </div>
            <button
              onClick={() => speak(word.word)}
              className="p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              title="Pronounce"
            >
              <Volume2 size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {word.definitions.map((def, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-start gap-3">
                {def.partOfSpeech && (
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex-shrink-0">
                    {def.partOfSpeech}
                  </span>
                )}
                <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                  {def.meaning}
                </p>
              </div>
              {def.examples && def.examples.length > 0 && (
                <div className="ml-12 space-y-1">
                  {def.examples.map((example, i) => (
                    <p key={i} className="text-base text-gray-500 dark:text-gray-400 italic leading-relaxed">
                      &quot;{example}&quot;
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-800 via-white dark:via-gray-800 to-transparent p-4 pt-8 flex items-center justify-between gap-3">
        {groups.length > 0 && (
          <div className="relative flex-1">
            <button
              onClick={() => setShowGroupSelector(!showGroupSelector)}
              className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center gap-2 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <Folder size={18} />
              {selectedGroup ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: groups.find(g => g.id === selectedGroup)?.color }}
                  />
                  <span className="font-medium">{groups.find(g => g.id === selectedGroup)?.name}</span>
                </div>
              ) : (
                <span className="font-medium">{tVocab('noGroup')}</span>
              )}
            </button>
            {showGroupSelector && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setShowGroupSelector(false);
                  }}
                  className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium">{tVocab('noGroup')}</span>
                </button>
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      setShowGroupSelector(false);
                    }}
                    className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium">{group.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved || alreadyInList}
          className={`
            px-6 py-3 rounded-xl font-medium text-base flex items-center gap-2 transition-all shadow-lg
            ${isSaved || alreadyInList
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }
            ${groups.length === 0 ? 'flex-1' : ''}
            disabled:cursor-not-allowed
          `}
        >
          {isSaved || alreadyInList ? (
            <>
              <Check size={20} />
              <span>{alreadyInList ? t('alreadyInVocabulary') : t('wordAdded')}</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{t('addToVocabulary')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}