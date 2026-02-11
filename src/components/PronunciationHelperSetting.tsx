'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useSettings, PronunciationHelper } from '@/hooks/useSettings';
import { useTranslations } from 'next-intl';

const options: { value: PronunciationHelper; labelKey: string; flag?: string }[] = [
  { value: 'auto', labelKey: 'auto' },
  { value: 'ko', labelKey: 'korean', flag: '🇰🇷' },
  { value: 'ja', labelKey: 'japanese', flag: '🇯🇵' },
  { value: 'en', labelKey: 'english', flag: '🇺🇸' },
  { value: 'off', labelKey: 'off' },
];

export default function PronunciationHelperSetting() {
  const t = useTranslations('pronunciationHelper');
  const { settings, setPronunciationHelper } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = options.find(o => o.value === settings.pronunciationHelper) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[140px]"
      >
        {currentOption.flag && <span>{currentOption.flag}</span>}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">
          {t(currentOption.labelKey)}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setPronunciationHelper(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  option.value === settings.pronunciationHelper ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  {option.flag && <span>{option.flag}</span>}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t(option.labelKey)}
                  </span>
                </span>
                {option.value === settings.pronunciationHelper && (
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
