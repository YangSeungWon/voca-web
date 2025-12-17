'use client';

import { useTranslations } from 'next-intl';

interface NavigationProps {
  activeView: 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more';
  onViewChange: (view: 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const t = useTranslations('nav');

  const tabs = [
    { id: 'home' as const, label: t('home') },
    { id: 'vocabulary' as const, label: t('vocabulary') },
    { id: 'study' as const, label: t('study') },
    { id: 'statistics' as const, label: t('statistics') },
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`
            px-6 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap
            ${activeView === tab.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
