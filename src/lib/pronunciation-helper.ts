/**
 * Pronunciation Helper Utility
 * Returns pronunciation in the user's preferred format based on settings
 */

import { ipaToHangul } from 'ipa-hangul';
import { ipaToKatakana } from './ipa-to-katakana';
import { arpabetToRespellingV2 } from './arpabet-to-respelling';
import { arpabetToKatakana } from './arpabet-to-katakana';
import { getPronunciationHelper, type PronunciationHelper } from '@/hooks/useSettings';

// Cache for CMU dictionary
let cmuDictionary: Record<string, string> | null = null;

async function loadCmuDictionary(): Promise<Record<string, string>> {
  if (cmuDictionary) return cmuDictionary;

  try {
    const { dictionary } = await import('cmu-pronouncing-dictionary');
    cmuDictionary = dictionary;
    return dictionary;
  } catch {
    return {};
  }
}

/**
 * Get the effective pronunciation helper setting
 * If 'auto', returns the setting based on current locale
 */
export function getEffectiveHelper(locale: string): PronunciationHelper {
  const setting = getPronunciationHelper();

  if (setting === 'auto') {
    // Map locale to pronunciation helper
    switch (locale) {
      case 'ko': return 'ko';
      case 'ja': return 'ja';
      case 'en': return 'en';
      case 'zh': return 'off'; // Chinese users get IPA only (no phonetic helper)
      default: return 'off';
    }
  }

  return setting;
}

/**
 * Get pronunciation helper text for a word
 * @param word - The English word
 * @param ipa - IPA pronunciation (e.g., "/həˈloʊ/")
 * @param locale - Current app locale
 * @returns Helper text in the appropriate format, or empty string if disabled
 */
export async function getPronunciationHelperText(
  word: string,
  ipa: string | undefined,
  locale: string
): Promise<string> {
  const helper = getEffectiveHelper(locale);

  if (helper === 'off' || !ipa) {
    return '';
  }

  const dictionary = await loadCmuDictionary();
  const arpabet = dictionary[word.toLowerCase()];

  switch (helper) {
    case 'ko':
      // Use ipa-hangul library
      return ipaToHangul(ipa) || '';

    case 'ja':
      // Prefer ARPABET-based conversion for accuracy
      if (arpabet) {
        return arpabetToKatakana(arpabet);
      }
      // Fallback to IPA-based conversion
      return ipaToKatakana(ipa) || '';

    case 'en':
      // Use ARPABET-based respelling
      if (arpabet) {
        return arpabetToRespellingV2(arpabet);
      }
      // No IPA-based fallback for English respelling
      return '';

    default:
      return '';
  }
}

/**
 * Synchronous version for when we already have pre-computed values
 * Used in components where async isn't ideal
 */
export function getPronunciationHelperTextSync(
  ipa: string | undefined,
  locale: string,
  precomputed?: {
    hangul?: string;
    katakana?: string;
    respelling?: string;
  }
): string {
  const helper = getEffectiveHelper(locale);

  if (helper === 'off' || !ipa) {
    return '';
  }

  switch (helper) {
    case 'ko':
      return precomputed?.hangul || ipaToHangul(ipa) || '';

    case 'ja':
      return precomputed?.katakana || ipaToKatakana(ipa) || '';

    case 'en':
      return precomputed?.respelling || '';

    default:
      return '';
  }
}

/**
 * Get label for the pronunciation helper (for UI display)
 */
export function getPronunciationHelperLabel(locale: string): string {
  const helper = getEffectiveHelper(locale);

  switch (helper) {
    case 'ko': return '한글';
    case 'ja': return 'カナ';
    case 'en': return 'Pronunciation';
    default: return '';
  }
}
