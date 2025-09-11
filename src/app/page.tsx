'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import WordDisplay from '@/components/WordDisplay';
import VocabularyList from '@/components/VocabularyList';
import Navigation from '@/components/Navigation';
import { DictionaryEntry } from '@/lib/dictionary';

export default function Home() {
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null);
  const [activeView, setActiveView] = useState<'search' | 'vocabulary' | 'study'>('search');
  const [refreshVocab, setRefreshVocab] = useState(0);

  const handleWordFound = (word: DictionaryEntry) => {
    setCurrentWord(word);
  };

  const handleWordSaved = () => {
    setRefreshVocab(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <header className="mb-8 pt-8">
          <h1 className="text-2xl font-light mb-6">Vocabulary</h1>
          <Navigation activeView={activeView} onViewChange={setActiveView} />
        </header>

        <main className="pb-8">
          {activeView === 'search' && (
            <div className="space-y-8">
              <SearchBar onWordFound={handleWordFound} />
              {currentWord && (
                <WordDisplay 
                  word={currentWord} 
                  onSave={handleWordSaved}
                />
              )}
            </div>
          )}

          {activeView === 'vocabulary' && (
            <VocabularyList key={refreshVocab} />
          )}

          {activeView === 'study' && (
            <div className="text-center py-16 text-gray-400">
              Study mode coming soon
            </div>
          )}
        </main>
      </div>
    </div>
  );
}