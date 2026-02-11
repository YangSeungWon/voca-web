'use client';

import { useState, useEffect } from 'react';
import { Trash2, Filter, ChevronUp, ChevronDown, Volume2, ChevronRight, Search, Plus, X } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { speak } from '@/lib/speech';
import ExampleSentences from './ExampleSentences';
import VocabularyCard from './VocabularyCard';
import PullToRefresh from './PullToRefresh';
import { apiFetch } from '@/lib/api-client';
import { formatPronunciation, getHelperText, getEffectiveHelper } from '@/lib/ipa-to-korean';
import { useLocale } from 'next-intl';

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
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const locale = useLocale();

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
      {/* Desktop Header */}
      <div className="hidden md:flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 items-center justify-between">
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
                      {item.word.pronunciation ? (() => {
                        const { korean, katakana, ipa } = formatPronunciation(item.word.pronunciation);
                        const helper = getEffectiveHelper(locale);
                        const helperText = getHelperText(item.word.pronunciation, locale, { korean, katakana });
                        return (
                          <div className="flex flex-col gap-1 pt-2">
                            {helper !== 'off' && helperText && (
                              <span
                                className="font-medium text-gray-600 dark:text-gray-300 text-lg"
                                dangerouslySetInnerHTML={{ __html: `[${helperText}]` }}
                              />
                            )}
                            <span className="text-lg text-gray-400">{ipa}</span>
                          </div>
                        );
                      })() : '-'}
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
                  {showFilter ? <X size={20} /> : <Search size={20} />}
                </button>
              )}
            </div>
            {/* Expandable Filter */}
            {showFilter && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Search in my words..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  autoFocus
                />
              </div>
            )}
          </div>

          {words.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 h-[calc(100vh-160px)] pb-24">
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
            <div className="p-4 pb-24">
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
            className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
          >
            <Plus size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
