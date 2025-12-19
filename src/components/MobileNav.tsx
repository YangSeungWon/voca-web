'use client';

import { Search, FolderOpen, BookOpen, BarChart3, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MobileNavProps {
  activeView: 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more';
  onViewChange: (view: 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more') => void;
}

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const t = useTranslations('nav');

  const tabs = [
    { id: 'vocabulary' as const, label: t('vocabulary'), icon: FolderOpen },
    { id: 'home' as const, label: t('search'), icon: Search },
    { id: 'study' as const, label: t('study'), icon: BookOpen },
    { id: 'statistics' as const, label: t('statistics'), icon: BarChart3 },
    { id: 'more' as const, label: t('more'), icon: MoreHorizontal },
  ];

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
