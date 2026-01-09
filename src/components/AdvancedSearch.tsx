'use client';

import { useState } from 'react';
import { Search, Filter, X, Calendar, Hash, Tag } from 'lucide-react';

interface FilterOptions {
  searchTerm: string;
  partOfSpeech: string;
  level: number | null;
  dateFrom: string;
  dateTo: string;
}

interface AdvancedSearchProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function AdvancedSearch({ onFilterChange }: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    partOfSpeech: '',
    level: null,
    dateFrom: '',
    dateTo: ''
  });

  const partsOfSpeech = [
    'noun', 'verb', 'adjective', 'adverb',
    'pronoun', 'preposition', 'conjunction', 'interjection'
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: string | number | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters: FilterOptions = {
      searchTerm: '',
      partOfSpeech: '',
      level: null,
      dateFrom: '',
      dateTo: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
      {/* Basic Search */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Search words or meanings..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2 text-sm border rounded-xl flex items-center gap-2 transition-colors ${
            showAdvanced
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter size={16} />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-500 text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Part of Speech */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Tag size={14} className="inline mr-1" />
              Part of Speech
            </label>
            <select
              value={filters.partOfSpeech}
              onChange={(e) => handleFilterChange('partOfSpeech', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All</option>
              {partsOfSpeech.map(pos => (
                <option key={pos} value={pos}>
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Hash size={14} className="inline mr-1" />
              Mastery Level
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => handleFilterChange('level', filters.level === level ? null : level)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    filters.level === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar size={14} className="inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-1"
          >
            <X size={14} />
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
