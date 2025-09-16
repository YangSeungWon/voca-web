'use client';

import { Home, Plus, BookOpen, BarChart3, Type } from 'lucide-react';

interface MobileNavProps {
  activeView: 'search' | 'vocabulary' | 'study' | 'statistics' | 'phonetics';
  onViewChange: (view: 'search' | 'vocabulary' | 'study' | 'statistics' | 'phonetics') => void;
}

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const tabs = [
    { id: 'vocabulary' as const, label: 'Words', icon: Home },
    { id: 'search' as const, label: 'Add', icon: Plus },
    { id: 'study' as const, label: 'Study', icon: BookOpen },
    { id: 'statistics' as const, label: 'Stats', icon: BarChart3 },
    { id: 'phonetics' as const, label: 'IPA', icon: Type },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-1 relative
                ${activeView === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
                }
              `}
            >
              {activeView === tab.id && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
              <Icon size={20} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}