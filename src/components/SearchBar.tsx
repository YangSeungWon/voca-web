'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DictionaryEntry, searchWord } from '@/lib/dictionary';
import { getApiEndpoint } from '@/config/api';

interface SearchBarProps {
  onWordFound: (word: DictionaryEntry) => void;
  autoFocus?: boolean;
}

export interface SearchBarRef {
  focus: () => void;
}

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ onWordFound, autoFocus }, ref) => {
  const t = useTranslations('home');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus()
  }));

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Try backend API first (has CMU dictionary for better pronunciation)
      const response = await fetch(getApiEndpoint(`/api/dictionary/external?word=${encodeURIComponent(query.trim())}`));
      if (response.ok) {
        const result: DictionaryEntry = await response.json();
        if (result) {
          onWordFound(result);
          return;
        }
      }
      // Fallback to direct API call if backend fails
      const fallbackResult = await searchWord(query);
      if (fallbackResult) {
        onWordFound(fallbackResult);
      }
    } catch (error) {
      // Fallback to direct API call on network error
      try {
        const fallbackResult = await searchWord(query);
        if (fallbackResult) {
          onWordFound(fallbackResult);
        }
      } catch (fallbackError) {
        console.error('Search failed:', fallbackError);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-4 py-4 text-lg md:text-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors shadow-sm"
          disabled={isSearching}
          lang="en"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
          inputMode="text"
          autoFocus={autoFocus}
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </form>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
