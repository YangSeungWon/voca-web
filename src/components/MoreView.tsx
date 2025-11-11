'use client';

import { useState } from 'react';
import { ChevronRight, Sun, User, RefreshCw, FolderOpen, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AuthStatus from './AuthStatus';
import SyncStatus from './SyncStatus';
import GroupManager from './GroupManager';
import PhoneticsReference from './PhoneticsReference';

export default function MoreView() {
  const [showPhonetics, setShowPhonetics] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        More
      </h1>

      {/* Settings Sections */}
      <div className="space-y-4">
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
      </div>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Voca Web v1.0.0</p>
        <p className="mt-1">Made with ❤️ for language learners</p>
      </div>
    </div>
  );
}
