'use client';

import { useState, useRef } from 'react';
import { ChevronRight, Sun, User, RefreshCw, FolderOpen, BookOpen, Download, Upload, Code } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AuthStatus from './AuthStatus';
import SyncStatus from './SyncStatus';
import GroupManager from './GroupManager';
import PhoneticsReference from './PhoneticsReference';
import DeveloperSettings from './DeveloperSettings';
import { parseCSV, generateCSV, downloadCSV, getCSVTemplate } from '@/lib/csv';
import { getUserId } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

export default function MoreView() {
  const [showPhonetics, setShowPhonetics] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showDeveloper, setShowDeveloper] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const words = await response.json();
        const csvContent = generateCSV(words);
        downloadCSV(csvContent, `vocabulary_${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        alert('Failed to export words');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting vocabulary');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        More
      </h1>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Import/Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Import & Export</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your vocabulary data</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              <span className="font-medium">{isImporting ? 'Importing...' : 'Import CSV'}</span>
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span className="font-medium">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={() => downloadCSV(getCSVTemplate(), 'vocabulary_template.csv')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download size={18} />
              <span className="font-medium">Template</span>
            </button>
          </div>
        </div>

        {/* Phonetics Reference */}
        <button
          onClick={() => setShowPhonetics(!showPhonetics)}
          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                IPA Phonetics Reference
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Learn pronunciation symbols
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showPhonetics ? 'rotate-90' : ''}`} />
        </button>

        {showPhonetics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <PhoneticsReference />
          </div>
        )}

        {/* Group Manager */}
        <button
          onClick={() => setShowGroups(!showGroups)}
          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                Manage Groups
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Organize your vocabulary
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showGroups ? 'rotate-90' : ''}`} />
        </button>

        {showGroups && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <GroupManager selectedGroup={null} onGroupChange={() => {}} />
          </div>
        )}

        {/* Theme Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  Dark Mode
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Toggle dark/light theme
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  Sync Status
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Cross-device synchronization
                </div>
              </div>
            </div>
            <SyncStatus />
          </div>
        </div>

        {/* Account */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  Account
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Login and account settings
                </div>
              </div>
            </div>
            <AuthStatus />
          </div>
        </div>

        {/* Developer Settings */}
        <button
          onClick={() => setShowDeveloper(!showDeveloper)}
          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Code className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                Developer Settings
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Debug and test features
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showDeveloper ? 'rotate-90' : ''}`} />
        </button>

        {showDeveloper && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <DeveloperSettings />
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Voca Web v1.0.0</p>
        <p className="mt-1">Made with ❤️ for language learners</p>
      </div>
    </div>
  );
}
