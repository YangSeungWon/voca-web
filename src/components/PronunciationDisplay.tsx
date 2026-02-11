'use client';

import { usePronunciationHelper } from '@/hooks/usePronunciationHelper';

interface PronunciationDisplayProps {
  word: string;
  pronunciation?: string;
  className?: string;
  ipaClassName?: string;
  helperClassName?: string;
  showIpa?: boolean;
}

/**
 * Component to display pronunciation with helper text based on user settings.
 * Handles async loading of respelling for English users.
 */
export default function PronunciationDisplay({
  word,
  pronunciation,
  className = '',
  ipaClassName = 'text-gray-500',
  helperClassName = 'font-medium text-gray-600 dark:text-gray-300',
  showIpa = true,
}: PronunciationDisplayProps) {
  const { helperText, helper } = usePronunciationHelper(word, pronunciation);

  if (!pronunciation) return null;

  return (
    <span className={className}>
      {helper !== 'off' && helperText ? (
        <>
          <span
            className={helperClassName}
            dangerouslySetInnerHTML={{ __html: `[${helperText}]` }}
          />
          {showIpa && <span className={`ml-1 ${ipaClassName}`}>{pronunciation}</span>}
        </>
      ) : (
        <span className={ipaClassName}>{pronunciation}</span>
      )}
    </span>
  );
}
