'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import VocabularyList from './VocabularyList';

export default function Page() {
  const [word, setWord] = useState('');
  const [userKey, setUserKey] = useState('');
  const [definition, setDefinition] = useState('');
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [isUserKeyFixed, setIsUserKeyFixed] = useState(false);

  useEffect(() => {
    // Check if userKey exists in localStorage on component mount
    const storedUserKey = localStorage.getItem('userKey');
    if (storedUserKey) {
      setUserKey(storedUserKey);
      setIsUserKeyFixed(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDefinition('');

    if (!userKey) {
      setError('User Key is required.');
      return;
    }

    try {
      const response = await axios.post('/api/words', { word, userKey });
      setDefinition(response.data.definition);
      setWord('');
      
      // Store userKey in localStorage and fix the input field
      if (!isUserKeyFixed) {
        localStorage.setItem('userKey', userKey);
        setIsUserKeyFixed(true);
      }

      // Refresh vocabulary list
      setRefreshCount(prev => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Vocabulary Builder</h1>
      
      <form onSubmit={handleSubmit} className="mt-4">
        <div>
          <label className="block">User Key:</label>
          <input
            type="text"
            value={userKey}
            onChange={(e) => setUserKey(e.target.value)}
            className="border p-2 w-full"
            placeholder="Enter your unique key"
            required
            disabled={isUserKeyFixed}
          />
        </div>
        <div className="mt-2">
          <label className="block">English Word:</label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="border p-2 w-full"
            placeholder="Enter an English word"
            required
          />
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded">
          Add Word
        </button>
      </form>

      {definition && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400 rounded">
          <strong>Definition:</strong> {definition}
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <VocabularyList userKey={userKey} refresh={refreshCount} />
    </div>
  );
}