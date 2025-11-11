'use client';

import { useState, useEffect } from 'react';
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
import SyncStatus from '@/components/SyncStatus';
import ExtensionBanner from '@/components/ExtensionBanner';
import MoreView from '@/components/MoreView';
import { DictionaryEntry } from '@/lib/dictionary';

type ViewType = 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more';

const hashToView: Record<string, ViewType> = {
  '#home': 'home',
  '#search': 'home', // Legacy redirect
  '#vocabulary': 'vocabulary',
  '#study': 'study',
  '#statistics': 'statistics',
  '#phonetics': 'phonetics',
  '#ipa': 'phonetics', // Alias for phonetics
  '#more': 'more',
};

const viewToHash: Record<ViewType, string> = {
  'home': '#home',
  'vocabulary': '#vocabulary',
  'study': '#study',
  'statistics': '#statistics',
  'phonetics': '#ipa',
  'more': '#more',
};

export default function Home() {
  const [currentWord, setCurrentWord] = useState<DictionaryEntry | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [refreshVocab, setRefreshVocab] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile environment based on screen width
  useEffect(() => {
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 768;
      console.log('Mobile detection:', { windowWidth: window.innerWidth, isMobile: isMobileSize });
      setIsMobile(isMobileSize);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle initial hash and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Check if token is passed from extension
      if (hash.startsWith('#token=')) {
        const token = decodeURIComponent(hash.substring(7));
        localStorage.setItem('token', token);
        // Clear token from URL
        window.location.hash = '#home';
        window.location.reload();
        return;
      }
      
      const view = hashToView[hash];
      if (view) {
        setActiveView(view);
      } else if (!hash) {
        // Default to home if no hash
        window.location.hash = viewToHash['home'];
      }
    };

    // Set initial view from hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when view changes
  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    window.location.hash = viewToHash[view];
  };

  const handleWordFound = (word: DictionaryEntry) => {
    setCurrentWord(word);
  };

  const handleWordSaved = () => {
    setRefreshVocab(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Desktop-only header */}
      {!isMobile && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <header className="py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/favicon.ico" alt="Voca" className="w-6 h-6" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voca Web</span>
                </div>
                <div className="flex items-center gap-2">
                  <SyncStatus />
                  <ThemeToggle />
                  <AuthStatus />
                </div>
              </div>
            </header>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-2">
        {!isMobile && (
          <Navigation activeView={activeView} onViewChange={handleViewChange} />
        )}
        
        <main className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm mt-2 transition-colors">
          {activeView === 'home' && (
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

          {activeView === 'more' && (
            <MoreView />
          )}
        </main>
      </div>
      
      {isMobile && <MobileNav activeView={activeView} onViewChange={handleViewChange} />}

      {/* Add padding at bottom for mobile nav */}
      {isMobile && <div className="h-16" />}
      
      {/* Chrome Extension Banner */}
      <ExtensionBanner />
    </div>
  );
}