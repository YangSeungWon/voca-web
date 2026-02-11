'use client';

import { useState, useEffect } from 'react';
import { Trash2, Filter, ChevronUp, ChevronDown, Volume2, ChevronRight, Search, Plus, X } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { speak } from '@/lib/speech';
import ExampleSentences from './ExampleSentences';
import VocabularyCard from './VocabularyCard';
import PullToRefresh from './PullToRefresh';
import { apiFetch } from '@/lib/api-client';
import PronunciationDisplay from './PronunciationDisplay';
import WordDisplay from './WordDisplay';
import { DictionaryEntry } from '@/lib/dictionary';
import { useTranslations } from 'next-intl';
import { syncWordsToWidget } from '@/lib/widget-sync';
import { ipaToHangul } from 'ipa-hangul';
import { ipaToKatakana } from '@/lib/ipa-to-katakana';
import { arpabetToRespellingV2 } from '@/lib/arpabet-to-respelling';
import { arpabetToKatakana } from '@/lib/arpabet-to-katakana';
import { getPronunciationHelper } from '@/hooks/useSettings';

interface VocabularyWord {
  id: string;
  word: {
    word: string;
    pronunciation?: string;
    definitions: {
      partOfSpeech?: string;
      meaning: string;
    }[];
  };
  level: number;
  createdAt: string;
  notes?: string;
}

type SortField = 'word' | 'level' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface VocabularyTableProps {
  onAddWord?: () => void;
}

export default function VocabularyTable({ onAddWord }: VocabularyTableProps) {
  const t = useTranslations('home');
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Search modal state (desktop only)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedWord, setSearchedWord] = useState<DictionaryEntry | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/dictionary/external?word=${encodeURIComponent(searchQuery.trim())}`);
      if (response.ok) {
        const result: DictionaryEntry = await response.json();
        if (result) {
          setSearchedWord(result);
          setShowSearchModal(true);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleWordSaved = () => {
    fetchVocabulary();
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchedWord(null);
  };

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWords(data);

        // Sync to Android widget
        const helperSetting = getPronunciationHelper();
        const widgetWords = await Promise.all(data.map(async (item: VocabularyWord) => {
          const pronunciation = item.word.pronunciation || '';
          let pronunciationHelper = '';

          if (pronunciation && helperSetting !== 'off') {
            const effectiveHelper = helperSetting === 'auto'
              ? (document.documentElement.lang || 'ko')
              : helperSetting;

            switch (effectiveHelper) {
              case 'ko':
                pronunciationHelper = ipaToHangul(pronunciation);
                break;
              case 'ja':
                try {
                  const { dictionary } = await import('cmu-pronouncing-dictionary');
                  const arpabet = dictionary[item.word.word.toLowerCase()];
                  if (arpabet) {
                    pronunciationHelper = arpabetToKatakana(arpabet);
                  } else {
                    pronunciationHelper = ipaToKatakana(pronunciation);
                  }
                } catch {
                  pronunciationHelper = ipaToKatakana(pronunciation);
                }
                break;
              case 'en':
                try {
                  const { dictionary } = await import('cmu-pronouncing-dictionary');
                  const arpabet = dictionary[item.word.word.toLowerCase()];
                  if (arpabet) {
                    pronunciationHelper = arpabetToRespellingV2(arpabet);
                  }
                } catch {
                  // No fallback for English respelling
                }
                break;
            }
          }

          return {
            word: item.word.word,
            pronunciation: pronunciation,
            pronunciationHelper: pronunciationHelper,
            meaning: item.word.definitions?.[0]?.meaning || '',
            level: item.level
          };
        }));
        syncWordsToWidget(widgetWords);
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await apiFetch(`/api/vocabulary/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setWords(words.filter(w => w.id !== id));
        selectedRows.delete(id);
        setSelectedRows(new Set(selectedRows));
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredWords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredWords.map(w => w.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredWords = words
    .filter(item =>
      filter === '' ||
      item.word.word.toLowerCase().includes(filter.toLowerCase()) ||
      item.word.definitions.some(d => d.meaning.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortField) {
        case 'word':
          aValue = a.word.word.toLowerCase();
          bValue = b.word.word.toLowerCase();
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Desktop Header with Search */}
      <div className="hidden md:block border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </form>
        {/* Filter and Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
              <Filter size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {filteredWords.length} words
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <table className="w-full text-xs">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
            <tr>
              <th className="w-8 p-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredWords.length && filteredWords.length > 0}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                <button
                  onClick={() => handleSort('word')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Word
                  {sortField === 'word' && (
                    sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </button>
              </th>
              <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">Pronunciation</th>
              <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">Definition</th>
              <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">Type</th>
              <th className="p-2 text-center font-medium text-gray-700 dark:text-gray-300">
                <button
                  onClick={() => handleSort('level')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Level
                  {sortField === 'level' && (
                    sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </button>
              </th>
              <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Date Added
                  {sortField === 'createdAt' && (
                    sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </button>
              </th>
              <th className="p-2 text-center font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  No words in your vocabulary yet.
                </td>
              </tr>
            ) : (
              filteredWords.map((item, index) => (
                <>
                  <tr
                    key={item.id}
                    className={`
                      border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700
                      ${selectedRows.has(item.id) ? 'bg-blue-100 dark:bg-blue-900' : ''}
                      ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                    `}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleExpandRow(item.id)}
                          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <ChevronRight
                            size={12}
                            className={`transition-transform ${expandedRows.has(item.id) ? 'rotate-90' : ''}`}
                          />
                        </button>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          className="cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="p-2 font-medium text-lg text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        {item.word.word}
                        <button
                          onClick={() => speak(item.word.word)}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Pronounce"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-gray-500 dark:text-gray-400">
                      {item.word.pronunciation ? (
                        <PronunciationDisplay
                          word={item.word.word}
                          pronunciation={item.word.pronunciation}
                          className="flex flex-col gap-1 pt-2"
                          helperClassName="font-medium text-gray-600 dark:text-gray-300 text-lg"
                          ipaClassName="text-lg text-gray-400"
                        />
                      ) : '-'}
                    </td>
                    <td className="p-2 text-base text-gray-900 dark:text-gray-100">{item.word.definitions[0]?.meaning || '-'}</td>
                    <td className="p-2 text-sm text-gray-500 dark:text-gray-400">
                      {item.word.definitions[0]?.partOfSpeech || '-'}
                    </td>
                    <td className="p-2 text-center text-gray-900 dark:text-gray-100">{item.level}</td>
                    <td className="p-2 text-gray-500 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(item.id) && (
                    <tr key={`${item.id}-examples`}>
                      <td colSpan={8} className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <ExampleSentences
                          wordId={item.id}
                          wordText={item.word.word}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden h-full relative">
        <PullToRefresh onRefresh={fetchVocabulary}>
          {/* Header with safe area for iOS notch */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pb-3 z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {words.length} words
                </span>
              </div>
              {words.length > 0 && (
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`p-2 rounded-lg transition-colors ${showFilter ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {showFilter ? <X size={20} /> : <Filter size={20} />}
                </button>
              )}
            </div>
            {/* Expandable Filter */}
            {showFilter && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Filter words..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  autoFocus
                />
              </div>
            )}
          </div>

          {words.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 pb-24" style={{ height: 'calc(100vh - 160px - env(safe-area-inset-bottom, 0px))' }}>
              <div className="text-center">
                <div className="text-gray-400 dark:text-gray-500 text-lg font-medium mb-2">
                  No words yet
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                  Add your first word!
                </p>
                {onAddWord && (
                  <button
                    onClick={onAddWord}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Word
                  </button>
                )}
              </div>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="text-gray-400 dark:text-gray-500">
                No matching words
              </div>
            </div>
          ) : (
            <div className="p-4" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
              {filteredWords.map((item) => (
                <VocabularyCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </PullToRefresh>

        {/* FAB - Add Word */}
        {onAddWord && (
          <button
            onClick={onAddWord}
            className="fixed right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
            style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Search Result Modal (Desktop) */}
      {showSearchModal && searchedWord && (
        <div className="hidden md:flex fixed inset-0 bg-black/50 items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {searchedWord.word}
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchedWord(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <WordDisplay word={searchedWord} onSave={handleWordSaved} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
