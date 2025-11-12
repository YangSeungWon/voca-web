/**
 * Wrapper for ipa-hangul npm package
 * Provides convenience functions for voca-web components
 */

import { ipaToHangul } from 'ipa-hangul';

/**
 * Format pronunciation for display
 * Returns both Korean Hangul (with styled stress markers) and original IPA
 */
export function formatPronunciation(ipa: string | undefined): { korean: string; ipa: string } {
  const cleanIpa = ipa || '';
  const korean = ipaToHangul(cleanIpa, { markStress: 'html' });

  // Apply custom styling to stress markers
  // <strong> for primary stress: blue, extra bold, larger
  // <em> for secondary stress: blue, normal bold, normal size
  const styledKorean = korean
    .replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: #2563EB; font-weight: 900; font-size: 1.1em;">$1</strong>')
    .replace(/<em>(.*?)<\/em>/g, '<em style="color: #2563EB; font-weight: 700; font-size: 1.05em; font-style: normal;">$1</em>');

  return {
    korean: styledKorean,
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
