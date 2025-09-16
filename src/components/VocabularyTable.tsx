'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Download, Upload, Filter, ChevronUp, ChevronDown, Volume2 } from 'lucide-react';
import { getUserId } from '@/lib/auth';
import { speak } from '@/lib/speech';
import { parseCSV, generateCSV, downloadCSV, getCSVTemplate } from '@/lib/csv';

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

export default function VocabularyTable() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const response = await fetch('/api/vocabulary', {
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
      const response = await fetch(`/api/vocabulary/${id}`, {
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

      const response = await fetch('/api/vocabulary/import', {
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
      let aValue: any, bValue: any;
      
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
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
          />
          <button className="p-1 hover:bg-gray-200 rounded-sm">
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

      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <table className="w-full text-xs">
          <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="w-8 p-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredWords.length && filteredWords.length > 0}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="p-2 text-left font-medium text-gray-700">
                <button
                  onClick={() => handleSort('word')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Word
                  {sortField === 'word' && (
                    sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </button>
              </th>
              <th className="p-2 text-left font-medium text-gray-700">Pronunciation</th>
              <th className="p-2 text-left font-medium text-gray-700">Definition</th>
              <th className="p-2 text-left font-medium text-gray-700">Type</th>
              <th className="p-2 text-center font-medium text-gray-700">
                <button
                  onClick={() => handleSort('level')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Level
                  {sortField === 'level' && (
                    sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </button>
              </th>
              <th className="p-2 text-left font-medium text-gray-700">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  Date Added
                  {sortField === 'createdAt' && (
                    sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </button>
              </th>
              <th className="p-2 text-center font-medium text-gray-700">Actions</th>
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
                <tr
                  key={item.id}
                  className={`
                    border-b border-gray-100 hover:bg-blue-50
                    ${selectedRows.has(item.id) ? 'bg-blue-100' : ''}
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  `}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="p-2 font-medium">
                    <div className="flex items-center gap-2">
                      {item.word.word}
                      <button
                        onClick={() => speak(item.word.word)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
                        title="Pronounce"
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="p-2 text-gray-500">{item.word.pronunciation || '-'}</td>
                  <td className="p-2">{item.word.definitions[0]?.meaning || '-'}</td>
                  <td className="p-2 text-gray-500">
                    {item.word.definitions[0]?.partOfSpeech || '-'}
                  </td>
                  <td className="p-2 text-center">{item.level}</td>
                  <td className="p-2 text-gray-500">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}