import { useState, useEffect } from 'react';
import syncService from '@/lib/sync-service';
import offlineDB from '@/lib/offline-db';
import { getAuthToken, getUserId } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';
import { syncWordsToWidget } from '@/lib/widget-sync';
import { ipaToHangul } from 'ipa-hangul';

interface VocabularyItem {
  id: string;
  word: {
    word: string;
    pronunciation?: string;
    definitions: Array<{
      partOfSpeech?: string;
      meaning: string;
    }>;
  };
  level: number;
  reviewCount: number;
  correctCount: number;
  createdAt: string;
  notes?: string;
}

export function useOfflineVocabulary() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const loadVocabulary = async () => {
    setLoading(true);
    try {
      // Try to load from server first if online
      const token = getAuthToken();
      if (navigator.onLine && token) {
        const response = await apiFetch('/api/vocabulary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setVocabulary(data);

          // Cache in IndexedDB for offline use
          await offlineDB.mergeServerData(data);

          // Sync to Android widget
          const widgetWords = data.map((item: VocabularyItem) => {
            const pronunciation = item.word.pronunciation || '';
            return {
              word: item.word.word,
              pronunciation: pronunciation,
              pronunciationKr: pronunciation ? ipaToHangul(pronunciation) : '',
              meaning: item.word.definitions?.[0]?.meaning || '',
              level: item.level
            };
          });
          syncWordsToWidget(widgetWords);

          setIsOnline(true);
          setLoading(false);
          return;
        }
      }

      // Fallback to offline data
      setIsOnline(false);
      const offlineData = await offlineDB.getVocabulary(getUserId());
      setVocabulary(offlineData);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);

      // Try offline data as last resort
      try {
        setIsOnline(false);
        const offlineData = await offlineDB.getVocabulary(getUserId());
        setVocabulary(offlineData);
      } catch (offlineError) {
        console.error('Failed to load offline data:', offlineError);
        setVocabulary([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabulary();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      loadVocabulary();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addWord = async (word: string) => {
    try {
      // Add via sync service (handles offline)
      await syncService.addWord({
        id: `temp-${Date.now()}`,
        word: {
          word,
          definitions: []
        },
        level: 0,
        reviewCount: 0,
        correctCount: 0,
        createdAt: new Date().toISOString()
      });

      // Reload vocabulary
      await loadVocabulary();
    } catch (error) {
      console.error('Failed to add word:', error);
      throw error;
    }
  };

  const updateWord = async (id: string, updates: Partial<VocabularyItem>) => {
    try {
      // Update via sync service (handles offline)
      await syncService.updateWord(id, updates);

      // Update local state immediately for better UX
      setVocabulary(prev =>
        prev.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
    } catch (error) {
      console.error('Failed to update word:', error);
      throw error;
    }
  };

  const deleteWord = async (id: string) => {
    try {
      // Delete via sync service (handles offline)
      await syncService.deleteWord(id);

      // Update local state immediately
      setVocabulary(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete word:', error);
      throw error;
    }
  };

  return {
    vocabulary,
    loading,
    isOnline,
    addWord,
    updateWord,
    deleteWord,
    refresh: loadVocabulary
  };
}
