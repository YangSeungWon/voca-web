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
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a word..."
        className="w-full px-4 py-3 pr-12 text-lg border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
        disabled={isSearching}
      />
      <button
        type="submit"
        disabled={isSearching || !query.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
      >
        <Search size={20} />
      </button>
    </form>
  );
}