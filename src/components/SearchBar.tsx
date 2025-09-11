'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { DictionaryEntry, searchWord } from '@/lib/dictionary';

interface SearchBarProps {
  onWordFound: (word: DictionaryEntry) => void;
}

export default function SearchBar({ onWordFound }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const result = await searchWord(query);
      if (result) {
        onWordFound(result);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter word to look up..."
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
        disabled={isSearching}
      />
      <button
        type="submit"
        disabled={isSearching || !query.trim()}
        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Search size={14} />
        Search
      </button>
    </form>
  );
}