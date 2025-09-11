'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import WordDisplay from '@/components/WordDisplay';
import VocabularyTable from '@/components/VocabularyTable';
import Navigation from '@/components/Navigation';
import { DictionaryEntry } from '@/lib/dictionary';

export default function Home() {
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null);
  const [activeView, setActiveView] = useState<'search' | 'vocabulary' | 'study'>('vocabulary');
  const [refreshVocab, setRefreshVocab] = useState(0);

  const handleWordFound = (word: DictionaryEntry) => {
    setCurrentWord(word);
  };

  const handleWordSaved = () => {
    setRefreshVocab(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <header className="py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-800">Vocabulary Manager</h1>
              <div className="text-xs text-gray-500">Professional Edition</div>
            </div>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2">
        <Navigation activeView={activeView} onViewChange={setActiveView} />
        
        <main className="bg-white border border-gray-200 rounded-sm mt-2">
          {activeView === 'search' && (
            <div className="p-4">
              <div className="mb-4">
                <SearchBar onWordFound={handleWordFound} />
              </div>
              {currentWord && (
                <WordDisplay 
                  word={currentWord} 
                  onSave={handleWordSaved}
                />
              )}
            </div>
          )}

          {activeView === 'vocabulary' && (
            <VocabularyTable key={refreshVocab} />
          )}

          {activeView === 'study' && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-sm">Study mode - Coming soon</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}