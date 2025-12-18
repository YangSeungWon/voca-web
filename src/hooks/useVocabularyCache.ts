import { useCallback } from 'react';
import { getAuthToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

const CACHE_KEY = 'vocabulary_words';

// Get cached words from localStorage
function getCachedWords(): Set<string> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return new Set(JSON.parse(cached));
    }
  } catch {
    // Invalid cache
  }
  return new Set();
}

export function useVocabularyCache() {
  // Refresh cache from server
  const refresh = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const wordList = data.map((v: { word: { word: string } }) =>
          v.word.word.toLowerCase()
        );
        localStorage.setItem(CACHE_KEY, JSON.stringify(wordList));
      }
    } catch (error) {
      console.error('Failed to refresh vocabulary cache:', error);
    }
  }, []);

  // Check if word exists (reads from localStorage directly)
  const hasWord = useCallback((word: string) => {
    const words = getCachedWords();
    return words.has(word.toLowerCase());
  }, []);

  // Add word to cache
  const addWord = useCallback((word: string) => {
    const words = getCachedWords();
    words.add(word.toLowerCase());
    localStorage.setItem(CACHE_KEY, JSON.stringify([...words]));
  }, []);

  return { hasWord, addWord, refresh };
}
