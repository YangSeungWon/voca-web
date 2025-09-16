'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import WordDisplay from '@/components/WordDisplay';
import VocabularyTable from '@/components/VocabularyTable';
import Navigation from '@/components/Navigation';
import AuthStatus from '@/components/AuthStatus';
import StudyMode from '@/components/StudyMode';
import Statistics from '@/components/Statistics';
import PhoneticsReference from '@/components/PhoneticsReference';
import GroupManager from '@/components/GroupManager';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import { DictionaryEntry } from '@/lib/dictionary';

export default function Home() {
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null);
  const [activeView, setActiveView] = useState<'search' | 'vocabulary' | 'study' | 'statistics' | 'phonetics'>('vocabulary');
  const [refreshVocab, setRefreshVocab] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleWordFound = (word: DictionaryEntry) => {
    setCurrentWord(word);
  };

  const handleWordSaved = () => {
    setRefreshVocab(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <header className="py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Vocabulary Manager</h1>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <AuthStatus />
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="hidden md:block">
          <Navigation activeView={activeView} onViewChange={setActiveView} />
        </div>
        
        <main className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm mt-2 transition-colors">
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
            <div className="flex h-full">
              <div className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-700">
                <GroupManager 
                  selectedGroup={selectedGroup}
                  onGroupChange={setSelectedGroup}
                />
              </div>
              <div className="flex-1">
                <VocabularyTable 
                  key={`${refreshVocab}-${selectedGroup}`} 
                  selectedGroup={selectedGroup}
                />
              </div>
            </div>
          )}

          {activeView === 'study' && (
            <StudyMode />
          )}

          {activeView === 'statistics' && (
            <Statistics />
          )}

          {activeView === 'phonetics' && (
            <PhoneticsReference />
          )}
        </main>
      </div>
      
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
      
      {/* Add padding at bottom for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}