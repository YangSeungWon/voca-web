/**
 * Wrapper for ipa-hangul npm package
 * Provides convenience functions for voca-web components
 */

import { ipaToHangul } from 'ipa-hangul';
import { ipaToKatakana } from './ipa-to-katakana';
import { getPronunciationHelper, type PronunciationHelper } from '@/hooks/useSettings';

/**
 * Check if user's browser language is Korean
 * @deprecated Use getEffectiveHelper from pronunciation-helper.ts instead
 */
export function isKoreanUser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.language.startsWith('ko');
}

/**
 * Check if user's browser language is Japanese
 * @deprecated Use getEffectiveHelper from pronunciation-helper.ts instead
 */
export function isJapaneseUser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.language.startsWith('ja');
}

/**
 * Get effective pronunciation helper based on settings and locale
 */
export function getEffectiveHelper(locale: string): PronunciationHelper {
  const setting = getPronunciationHelper();

  if (setting === 'auto') {
    switch (locale) {
      case 'ko': return 'ko';
      case 'ja': return 'ja';
      case 'en': return 'en';
      case 'zh': return 'off';
      default: return 'off';
    }
  }

  return setting;
}

/**
 * Format pronunciation for display
 * Returns Korean Hangul, Japanese Katakana (with styled stress markers), and original IPA
 */
export function formatPronunciation(ipa: string | undefined): {
  korean: string;
  katakana: string;
  ipa: string;
} {
  const cleanIpa = ipa || '';
  const korean = ipaToHangul(cleanIpa, { markStress: 'html' });
  const katakana = ipaToKatakana(cleanIpa);

  // Apply custom styling to stress markers with class names for dark mode support
  // Single char: dot above center
  // Multi char: dots above first and last char with line connecting
  const styledKorean = korean
    .replace(/<strong>(.*?)<\/strong>/g, (_match, content) => {
      const text = content.replace(/<[^>]+>/g, '');
      const chars = [...text];
      if (chars.length === 1) {
        return `<span class="stress-single">${content}</span>`;
      } else {
        const first = chars[0];
        const middle = chars.slice(1, -1).join('');
        const last = chars[chars.length - 1];
        return `<span class="stress-multi"><span class="stress-dot">${first}</span>${middle}<span class="stress-dot">${last}</span><span class="stress-line"></span></span>`;
      }
    })
    .replace(/<em>(.*?)<\/em>/g, '<em class="stress-secondary">$1</em>');

  return {
    korean: styledKorean,
    katakana,
    ipa: cleanIpa
  };
}

/**
 * Get pronunciation helper text based on user settings
 */
export function getHelperText(
  ipa: string | undefined,
  locale: string,
  precomputed?: { korean?: string; katakana?: string; respelling?: string }
): string {
  const helper = getEffectiveHelper(locale);
  const cleanIpa = ipa || '';

  if (helper === 'off' || !cleanIpa) {
    return '';
  }

  switch (helper) {
    case 'ko': {
      if (precomputed?.korean) return precomputed.korean;
      const korean = ipaToHangul(cleanIpa, { markStress: 'html' });
      return korean
        .replace(/<strong>(.*?)<\/strong>/g, (_match, content) => {
          const text = content.replace(/<[^>]+>/g, '');
          const chars = [...text];
          if (chars.length === 1) {
            return `<span class="stress-single">${content}</span>`;
          } else {
            const first = chars[0];
            const middle = chars.slice(1, -1).join('');
            const last = chars[chars.length - 1];
            return `<span class="stress-multi"><span class="stress-dot">${first}</span>${middle}<span class="stress-dot">${last}</span><span class="stress-line"></span></span>`;
          }
        })
        .replace(/<em>(.*?)<\/em>/g, '<em class="stress-secondary">$1</em>');
    }

    case 'ja':
      return precomputed?.katakana || ipaToKatakana(cleanIpa);

    case 'en':
      return precomputed?.respelling || '';

    default:
      return '';
  }
}

/**
 * Get only Korean pronunciation
 */
export function getKoreanPronunciation(ipa: string | undefined): string {
  return ipaToHangul(ipa || '');
}

/**
 * Legacy export - same as ipaToHangul from npm package
 * @deprecated Use ipaToHangul from 'ipa-hangul' directly
 */
export function ipaToKorean(ipa: string | undefined): string {
  return ipaToHangul(ipa || '');
}

// Re-export from npm package for convenience
export { ipaToHangul } from 'ipa-hangul';
