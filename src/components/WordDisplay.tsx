'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Save, Volume2 } from 'lucide-react';
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

export default function WordDisplay({ word, onSave }: WordDisplayProps) {
  const t = useTranslations('home');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { hasWord, addWord } = useVocabularyCache();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const alreadyInList = hasWord(word.word);
  const isNotFound = word.definitions.some(def => def.partOfSpeech === 'not found');

  // Reset saved state when word changes
  useEffect(() => {
    setIsSaved(false);
  }, [word.word]);

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
          word: word.word
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
              <h2 className={`text-3xl sm:text-4xl font-bold break-words ${
                isNotFound
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-white'
              }`}>
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
            {!isNotFound && (
              <button
                onClick={() => speak(word.word)}
                className="p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                title="Pronounce"
              >
                <Volume2 size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {word.definitions.map((def, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-start gap-3">
                {def.partOfSpeech && def.partOfSpeech !== 'not found' && (
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
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

      {/* Floating action button - hidden when word not found */}
      {!isNotFound && (
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-800 via-white dark:via-gray-800 to-transparent p-4 pt-8">
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved || alreadyInList}
            className={`
              w-full px-6 py-3 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all shadow-lg
              ${isSaved || alreadyInList
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }
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
      )}
    </div>
  );
}
