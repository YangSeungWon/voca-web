/**
 * Wrapper for ipa-hangul npm package
 * Provides convenience functions for voca-web components
 */

import { ipaToHangul } from 'ipa-hangul';
import { ipaToKatakana } from './ipa-to-katakana';

/**
 * Check if user's browser language is Korean
 */
export function isKoreanUser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.language.startsWith('ko');
}

/**
 * Check if user's browser language is Japanese
 */
export function isJapaneseUser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.language.startsWith('ja');
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
  // <strong> for primary stress: blue-600/blue-400, extra bold, larger
  // <em> for secondary stress: blue-600/blue-400, normal bold, normal size
  const styledKorean = korean
    .replace(/<strong>(.*?)<\/strong>/g, '<strong class="stress-primary">$1</strong>')
    .replace(/<em>(.*?)<\/em>/g, '<em class="stress-secondary">$1</em>');

  return {
    korean: styledKorean,
    katakana,
    ipa: cleanIpa
  };
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
