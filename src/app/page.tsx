'use client';

import { useState, useEffect, useRef } from 'react';
import SearchBar, { SearchBarRef } from '@/components/SearchBar';
import WordDisplay from '@/components/WordDisplay';
import VocabularyTable from '@/components/VocabularyTable';
import Navigation from '@/components/Navigation';
import AuthStatus from '@/components/AuthStatus';
import StudyMode from '@/components/StudyMode';
import Statistics from '@/components/Statistics';
import PhoneticsReference from '@/components/PhoneticsReference';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import SyncStatus from '@/components/SyncStatus';
import ExtensionBanner from '@/components/ExtensionBanner';
import MoreView from '@/components/MoreView';
import LoginPrompt from '@/components/LoginPrompt';
import { DictionaryEntry } from '@/lib/dictionary';
import { useAuth } from '@/hooks/useAuth';
import { useBackButton } from '@/hooks/useBackButton';
import { useVocabularyCache } from '@/hooks/useVocabularyCache';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';

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
  const searchBarRef = useRef<SearchBarRef>(null);
  const [activeView, setActiveView] = useState<ViewType>('vocabulary');
  const [refreshVocab, setRefreshVocab] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { refresh: refreshVocabCache } = useVocabularyCache();
  const { isVisible: isKeyboardVisible, viewportHeight } = useKeyboardVisible();

  // Handle Android back button
  useBackButton({
    onBack: () => {
      // If viewing a word on home, clear it first
      if (activeView === 'home' && currentWord) {
        setCurrentWord(null);
        currentWordRef.current = null;
        window.location.hash = 'home';
        return true; // Handled
      }
      return false; // Use default behavior
    }
  });

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

  // Refresh vocabulary cache when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshVocabCache();
    }
  }, [isAuthenticated, refreshVocabCache]);

  // Track current word in ref for use in hash change handler
  const currentWordRef = useRef<string | null>(null);

  // Load word from URL parameter
  const loadWordFromUrl = async (word: string) => {
    if (currentWordRef.current === word) return;
    try {
      const response = await fetch(`/api/dictionary/external?word=${encodeURIComponent(word)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result: DictionaryEntry = await response.json();
        if (result) {
          setCurrentWord(result);
          currentWordRef.current = result.word;
          return;
        }
      }
      // Fallback
      const { searchWord } = await import('@/lib/dictionary');
      const fallback = await searchWord(word);
      if (fallback) {
        setCurrentWord(fallback);
        currentWordRef.current = fallback.word;
      }
    } catch (error) {
      console.error('Failed to load word from URL:', error);
    }
  };

  // Handle initial hash and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      // Check if token is passed from extension
      if (hash.startsWith('#token=')) {
        const token = decodeURIComponent(hash.substring(7));
        localStorage.setItem('token', token);
        window.location.hash = '#home';
        window.location.reload();
        return;
      }

      // Parse hash and query params: #home?word=xxx
      const [hashPart, queryPart] = hash.split('?');
      const view = hashToView[hashPart];
      if (view) {
        setActiveView(view);

        // Handle word parameter in URL
        if (view === 'home' && queryPart) {
          const params = new URLSearchParams(queryPart);
          const word = params.get('word');
          if (word) {
            loadWordFromUrl(word);
          }
        } else if (view === 'home' && !queryPart) {
          setCurrentWord(null);
          currentWordRef.current = null;
        }
      } else if (!hash) {
        // Native app defaults to vocabulary, web defaults to home (search)
        const isNativeApp = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
        window.location.hash = viewToHash[isNativeApp ? 'vocabulary' : 'home'];
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update hash when view changes
  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    window.location.hash = viewToHash[view];
  };

  const handleWordFound = (word: DictionaryEntry) => {
    setCurrentWord(word);
    currentWordRef.current = word.word;
    // Update URL with word parameter
    window.location.hash = `home?word=${encodeURIComponent(word.word)}`;
  };

  const handleWordSaved = () => {
    setRefreshVocab(prev => prev + 1);
  };


  // Hide overflow on mobile only for certain views
  const hideOverflow = isMobile && (
    (activeView === 'home' && !currentWord) ||
    activeView === 'study'
  );


  return (
    <div className={`bg-gray-50 dark:bg-gray-900 transition-colors ${hideOverflow ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Desktop-only header */}
      {!isMobile && (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src="/favicon.ico" alt="Voca" className="w-6 h-6" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voca Web</span>
                </div>
                <Navigation activeView={activeView} onViewChange={handleViewChange} />
              </div>
              <div className="flex items-center gap-2">
                <SyncStatus />
                <ThemeToggle />
                <AuthStatus />
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={hideOverflow ? '' : `max-w-7xl mx-auto ${isMobile ? 'px-4 pb-20' : 'px-4 py-4'}`}>

        <main
          className={isMobile ? '' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm mt-2 transition-colors'}
        >
          {activeView === 'home' && (
            <div
              className={isMobile ? (currentWord ? 'px-4 pb-4' : 'flex flex-col items-center justify-center px-4 cursor-text') : 'p-1'}
              style={isMobile && !currentWord ? {
                height: `${viewportHeight - 64}px`, // 64px for bottom nav
                paddingBottom: isKeyboardVisible ? '16px' : '80px'
              } : (isMobile && currentWord ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' } : undefined)}
              onClick={() => !currentWord && isMobile && searchBarRef.current?.focus()}
            >
              {!currentWord && isMobile ? (
                <div className="space-y-8 w-full max-w-md">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="text-gray-400 dark:text-gray-600 mb-4">
                      <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl text-gray-600 dark:text-gray-400 font-semibold mb-2">Search for a word</p>
                    <p className="text-base text-gray-500 dark:text-gray-500">Type and press enter to look up</p>
                  </div>
                  <SearchBar ref={searchBarRef} onWordFound={handleWordFound} autoFocus />
                </div>
              ) : (
                <>
                  <div className={isMobile ? 'mb-6' : 'mb-4'}>
                    <SearchBar onWordFound={handleWordFound} />
                    {/* Show inline message when word is not found */}
                    {currentWord?.definitions.some(def => def.partOfSpeech === 'not found') && (
                      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-center">
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          No definition found for &quot;<span className="font-medium">{currentWord.word}</span>&quot;
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Please check your spelling.
                        </p>
                      </div>
                    )}
                  </div>
                  {currentWord && !currentWord.definitions.some(def => def.partOfSpeech === 'not found') && (
                    <WordDisplay
                      word={currentWord}
                      onSave={handleWordSaved}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeView === 'vocabulary' && (
            !isAuthenticated && !isLoading ? (
              <LoginPrompt message="Sign in to access your vocabulary list" />
            ) : (
              <div className={isMobile ? 'h-full' : ''}>
                <VocabularyTable
                  key={refreshVocab}
                  onAddWord={() => handleViewChange('home')}
                />
              </div>
            )
          )}

          {activeView === 'study' && (
            <div style={isMobile ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}>
              {!isAuthenticated && !isLoading ? (
                <LoginPrompt message="Sign in to start studying your words" />
              ) : (
                <StudyMode />
              )}
            </div>
          )}

          {activeView === 'statistics' && (
            <div className={isMobile ? 'px-4 pb-4' : ''} style={isMobile ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' } : undefined}>
              {!isAuthenticated && !isLoading ? (
                <LoginPrompt message="Sign in to view your learning statistics" />
              ) : (
                <Statistics />
              )}
            </div>
          )}

          {activeView === 'phonetics' && (
            <div className={isMobile ? 'px-4 pb-4' : ''} style={isMobile ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' } : undefined}>
              <PhoneticsReference />
            </div>
          )}

          {activeView === 'more' && (
            <div className={isMobile ? 'px-4 pb-4' : ''} style={isMobile ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' } : undefined}>
              {!isAuthenticated && !isLoading ? (
                <LoginPrompt message="Sign in to access settings and manage your data" />
              ) : (
                <MoreView />
              )}
            </div>
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