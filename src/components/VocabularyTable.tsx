'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Download, Upload, Filter, ChevronUp, ChevronDown, Volume2, ChevronRight } from 'lucide-react';
import { getUserId } from '@/lib/auth';
import { speak } from '@/lib/speech';
import { parseCSV, generateCSV, downloadCSV, getCSVTemplate } from '@/lib/csv';
import ExampleSentences from './ExampleSentences';
import VocabularyCard from './VocabularyCard';
import PullToRefresh from './PullToRefresh';
import { apiFetch } from '@/lib/api-client';

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
  groupId?: string;
  group?: {
    id: string;
    name: string;
    color: string;
  };
}

type SortField = 'word' | 'level' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface VocabularyTableProps {
  selectedGroup: string | null;
}

export default function VocabularyTable({ selectedGroup }: VocabularyTableProps) {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVocabulary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  const fetchVocabulary = async () => {
    try {
      const url = selectedGroup 
        ? `/api/vocabulary?groupId=${selectedGroup}`
        : '/api/vocabulary';
      const response = await fetch(url, {
        headers: {
          'x-user-id': getUserId()
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
      const response = await apiFetch(`/api/vocabulary/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': getUserId()
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

  const exportToCSV = () => {
    const exportData = selectedRows.size > 0 
      ? filteredWords.filter(w => selectedRows.has(w.id))
      : filteredWords;
    
    const csvContent = generateCSV(exportData);
    downloadCSV(csvContent, `vocabulary_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsedWords = parseCSV(text);
      
      if (parsedWords.length === 0) {
        alert('No valid words found in the CSV file');
        return;
      }

      const response = await apiFetch('/api/vocabulary/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({ words: parsedWords })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Import complete!\n✅ Imported: ${result.imported}\n⚠️ Duplicates: ${result.duplicates}\n❌ Failed: ${result.failed}`);
        fetchVocabulary(); // Refresh the list
      } else {
        alert('Failed to import words');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error reading CSV file. Please check the format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm">
            <Filter size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-sm hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
            title="Import words from CSV file"
          >
            <Upload size={12} />
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={() => downloadCSV(getCSVTemplate(), 'vocabulary_template.csv')}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded-sm hover:bg-gray-700"
            title="Download CSV template"
          >
            Template
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-sm hover:bg-green-700 flex items-center gap-1"
          >
            <Download size={12} />
            Export{selectedRows.size > 0 && ` (${selectedRows.size})`}
          </button>
          <span className="text-xs text-gray-500">
            {filteredWords.length} words
          </span>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <input
            type="text"
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg"
          >
            Import CSV
          </button>
          <button
            onClick={exportToCSV}
            className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded-lg"
          >
            Export {selectedRows.size > 0 && `(${selectedRows.size})`}
          </button>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          {filteredWords.length} words
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
              <th className="p-2 text-left font-medium text-gray-700 dark:text-gray-300">Group</th>
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
                <td colSpan={9} className="p-8 text-center text-gray-400">
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
                          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
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
                    <td className="p-2 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        {item.word.word}
                        <button
                          onClick={() => speak(item.word.word)}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                          title="Pronounce"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-gray-500 dark:text-gray-400">{item.word.pronunciation || '-'}</td>
                    <td className="p-2 text-gray-900 dark:text-gray-100">{item.word.definitions[0]?.meaning || '-'}</td>
                    <td className="p-2 text-gray-500 dark:text-gray-400">
                      {item.word.definitions[0]?.partOfSpeech || '-'}
                    </td>
                    <td className="p-2 text-gray-900 dark:text-gray-100">
                      {item.group ? (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: item.group.color }}
                          />
                          <span className="text-xs">{item.group.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
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
                      <td colSpan={9} className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
      <div className="md:hidden h-full">
        <PullToRefresh onRefresh={fetchVocabulary}>
          <div className="p-4">
            {filteredWords.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                No words in your vocabulary yet.
              </div>
            ) : (
              <div>
                {filteredWords.map((item) => (
                  <VocabularyCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}