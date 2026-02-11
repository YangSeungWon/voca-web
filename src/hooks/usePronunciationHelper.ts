'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ipaToHangul } from 'ipa-hangul';
import { ipaToKatakana } from '@/lib/ipa-to-katakana';
import { arpabetToKatakana } from '@/lib/arpabet-to-katakana';
import { arpabetToRespellingV2 } from '@/lib/arpabet-to-respelling';
import { getEffectiveHelper } from '@/lib/ipa-to-korean';

// Cache for CMU dictionary
let cmuDictCache: Record<string, string> | null = null;
let cmuLoadPromise: Promise<Record<string, string>> | null = null;

async function loadCmuDict(): Promise<Record<string, string>> {
  if (cmuDictCache) return cmuDictCache;
  if (cmuLoadPromise) return cmuLoadPromise;

  cmuLoadPromise = import('cmu-pronouncing-dictionary').then(mod => {
    cmuDictCache = mod.dictionary;
    return mod.dictionary;
  });

  return cmuLoadPromise;
}

/**
 * Hook to get pronunciation helper text based on user settings
 * Handles async CMU dictionary lookup for respelling
 */
export function usePronunciationHelper(word: string, ipa: string | undefined) {
  const locale = useLocale();
  const helper = getEffectiveHelper(locale);
  const [helperText, setHelperText] = useState<string>('');

  useEffect(() => {
    if (!ipa || helper === 'off') {
      setHelperText('');
      return;
    }

    let cancelled = false;

    async function compute() {
      let result = '';
      const ipaStr = ipa || '';

      switch (helper) {
        case 'ko': {
          const korean = ipaToHangul(ipaStr, { markStress: 'html' });
          result = korean
            .replace(/<strong>(.*?)<\/strong>/g, '<strong class="stress-primary">$1</strong>')
            .replace(/<em>(.*?)<\/em>/g, '<em class="stress-secondary">$1</em>');
          break;
        }

        case 'ja': {
          // Try ARPABET-based conversion first
          try {
            const dict = await loadCmuDict();
            const arpabet = dict[word.toLowerCase()];
            if (arpabet) {
              result = arpabetToKatakana(arpabet);
            } else {
              result = ipaToKatakana(ipaStr);
            }
          } catch {
            result = ipaToKatakana(ipaStr);
          }
          break;
        }

        case 'en': {
          // English respelling requires CMU dictionary
          try {
            const dict = await loadCmuDict();
            const arpabet = dict[word.toLowerCase()];
            if (arpabet) {
              result = arpabetToRespellingV2(arpabet);
            }
          } catch {
            // No fallback for English
          }
          break;
        }
      }

      if (!cancelled) {
        setHelperText(result);
      }
    }

    compute();

    return () => {
      cancelled = true;
    };
  }, [word, ipa, helper]);

  return { helperText, helper, locale };
}
