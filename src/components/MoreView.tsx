'use client';

import { useState, useRef } from 'react';
import { ChevronRight, Sun, User, RefreshCw, BookOpen, Download, Upload, Code, MessageSquare, Globe, Volume2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AuthStatus from './AuthStatus';
import SyncStatus from './SyncStatus';
import PhoneticsReference from './PhoneticsReference';
import DeveloperSettings from './DeveloperSettings';
import FeedbackForm from './FeedbackForm';
import LanguageSelector from './LanguageSelector';
import PronunciationHelperSetting from './PronunciationHelperSetting';
import { useTranslations } from 'next-intl';
import { parseCSV, generateCSV, downloadCSV, getCSVTemplate } from '@/lib/csv';
import { getAuthToken } from '@/lib/auth';
import { apiFetch } from '@/lib/api-client';

export default function MoreView() {
  const t = useTranslations('more');
  const tImport = useTranslations('import');
  const tExport = useTranslations('export');
  const [showPhonetics, setShowPhonetics] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
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
        alert(tImport('noValidWords'));
        return;
      }

      const token = getAuthToken();
      if (!token) {
        alert(tImport('loginRequired'));
        return;
      }

      const response = await apiFetch('/api/vocabulary/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ words: parsedWords })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${tImport('complete')}\n✅ ${tImport('imported')}: ${result.imported}\n⚠️ ${tImport('duplicates')}: ${result.duplicates}\n❌ ${tImport('failed')}: ${result.failed}`);
      } else {
        alert(tImport('error'));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(tImport('csvError'));
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
      const token = getAuthToken();
      if (!token) {
        alert(tExport('loginRequired'));
        return;
      }

      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const words = await response.json();
        const csvContent = generateCSV(words);
        downloadCSV(csvContent, `vocabulary_${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        alert(tExport('error'));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(tExport('exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t('title')}
      </h1>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Import/Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('importExport')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tImport('manageData')}</p>
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
              <span className="font-medium">{t('importCSV')}</span>
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              <span className="font-medium">{t('exportCSV')}</span>
            </button>
            <button
              onClick={() => downloadCSV(getCSVTemplate(), 'vocabulary_template.csv')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download size={18} />
              <span className="font-medium">{t('template')}</span>
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('language')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('languageDescription')}
                </div>
              </div>
            </div>
            <LanguageSelector />
          </div>
        </div>

        {/* Pronunciation Helper */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('pronunciationHelper')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('pronunciationHelperDescription')}
                </div>
              </div>
            </div>
            <PronunciationHelperSetting />
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
                {t('phonetics')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('phoneticsDescription')}
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

        {/* Theme Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('darkMode')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('darkModeDescription')}
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
                  {t('sync')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('syncDescription')}
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
                  {t('account')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('accountDescription')}
                </div>
              </div>
            </div>
            <AuthStatus />
          </div>
        </div>

        {/* Feedback */}
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                {t('feedback')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('feedbackDescription')}
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showFeedback ? 'rotate-90' : ''}`} />
        </button>

        {showFeedback && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <FeedbackForm />
          </div>
        )}

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
                {t('developer')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('developerDescription')}
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
        <p>{t('version')}</p>
        <p className="mt-1">{t('madeWith')}</p>
      </div>
    </div>
  );
}
