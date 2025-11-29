import { useState, useEffect, useCallback } from 'react';
import { getUserId } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

const CACHE_KEY = 'vocabulary_words';

export function useVocabularyCache() {
  const [words, setWords] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setWords(new Set(JSON.parse(cached)));
      } catch {
        // Invalid cache, will refresh from server
      }
    }
    setIsLoaded(true);
  }, []);

  // Refresh cache from server
  const refresh = useCallback(async () => {
    try {
      const response = await apiFetch('/api/vocabulary?fields=word', {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const data = await response.json();
        const wordList = data.map((v: { word: { word: string } }) =>
          v.word.word.toLowerCase()
        );
        setWords(new Set(wordList));
        localStorage.setItem(CACHE_KEY, JSON.stringify(wordList));
      }
    } catch (error) {
      console.error('Failed to refresh vocabulary cache:', error);
    }
  }, []);

  // Check if word exists
  const hasWord = useCallback((word: string) => {
    return words.has(word.toLowerCase());
  }, [words]);

  // Add word to cache (call after successful save)
  const addWord = useCallback((word: string) => {
    setWords(prev => {
      const next = new Set(prev);
      next.add(word.toLowerCase());
      localStorage.setItem(CACHE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { hasWord, addWord, refresh, isLoaded, wordCount: words.size };
}
