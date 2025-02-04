'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Word {
  id: number;
  content: string;
  definition: string;
}

interface VocabularyListProps {
  userKey: string;
  refresh: number;
}

export default function VocabularyList({ userKey, refresh }: VocabularyListProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingWordId, setDeletingWordId] = useState<number | null>(null);

  const fetchWords = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/getWords', { params: { userKey } });
      setWords(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch words.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (wordId: number) => {
    setDeletingWordId(wordId);
    try {
      await axios.delete('/api/deleteWord', { data: { wordId, userKey } });
      setWords(prevWords => prevWords.filter(word => word.id !== wordId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete word.');
    } finally {
      setDeletingWordId(null);
    }
  };

  useEffect(() => {
    if (userKey) {
      fetchWords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, refresh]);

  if (!userKey) {
    return <p className="mt-4 text-gray-600">Please enter your user key to view your vocabulary list.</p>;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">Your Vocabulary List</h2>
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      {isLoading ? (
        <p className="mt-2 text-blue-500">Loading words...</p>
      ) : words.length === 0 ? (
        <p className="mt-2 text-gray-600">No words found. Start adding some!</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-200">
          {words.map(word => (
            <li key={word.id} className="flex justify-between items-center p-2">
              <div>
                <strong>{word.content}:</strong> {word.definition}
              </div>
              <button
                onClick={() => handleDelete(word.id)}
                className={`text-red-500 hover:underline ${deletingWordId === word.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={deletingWordId === word.id}
              >
                {deletingWordId === word.id ? 'Deleting...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 