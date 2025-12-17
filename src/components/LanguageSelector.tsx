'use client';

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useLocale } from 'next-intl';

export default function LanguageSelector() {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLocaleChange = async (locale: Locale) => {
    if (locale === currentLocale || isChanging) return;

    setIsChanging(true);
    try {
      const res = await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      if (res.ok) {
        // Reload to apply new locale
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        disabled={isChanging}
      >
        <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {localeFlags[currentLocale]} {localeNames[currentLocale]}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  locale === currentLocale ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{localeFlags[locale]}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {localeNames[locale]}
                  </span>
                </span>
                {locale === currentLocale && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
