/**
 * Wrapper for ipa-hangul npm package
 * Provides convenience functions for voca-web components
 */

import { ipaToHangul } from 'ipa-hangul';

/**
 * Format pronunciation for display
 * Returns both Korean Hangul and original IPA
 */
export function formatPronunciation(ipa: string | undefined): { korean: string; ipa: string } {
  const cleanIpa = ipa || '';
  const korean = ipaToHangul(cleanIpa);

  return {
    korean,
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
