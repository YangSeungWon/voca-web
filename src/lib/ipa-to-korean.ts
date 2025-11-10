/**
 * IPA (International Phonetic Alphabet) to Korean (Hangul) pronunciation converter
 * Converts English IPA notation to approximate Korean pronunciation using Jamo assembly
 *
 * Korean Jamo indices reference:
 * Choseong (초성): ㄱ(0) ㄲ(1) ㄴ(2) ㄷ(3) ㄸ(4) ㄹ(5) ㅁ(6) ㅂ(7) ㅃ(8) ㅅ(9) ㅆ(10) ㅇ(11) ㅈ(12) ㅉ(13) ㅊ(14) ㅋ(15) ㅌ(16) ㅍ(17) ㅎ(18)
 * Jungseong (중성): ㅏ(0) ㅐ(1) ㅑ(2) ㅒ(3) ㅓ(4) ㅔ(5) ㅕ(6) ㅖ(7) ㅗ(8) ㅘ(9) ㅙ(10) ㅚ(11) ㅛ(12) ㅜ(13) ㅝ(14) ㅞ(15) ㅟ(16) ㅠ(17) ㅡ(18) ㅢ(19) ㅣ(20)
 * Jongseong (종성): (none)(0) ㄱ(1) ㄲ(2) ㄳ(3) ㄴ(4) ㄵ(5) ㄶ(6) ㄷ(7) ㄹ(8) ㄺ(9) ㄻ(10) ㄼ(11) ㄽ(12) ㄾ(13) ㄿ(14) ㅀ(15) ㅁ(16) ㅂ(17) ㅄ(18) ㅅ(19) ㅆ(20) ㅇ(21) ㅈ(22) ㅊ(23) ㅋ(24) ㅌ(25) ㅍ(26) ㅎ(27)
 */

// Consonant clusters - check these BEFORE individual consonants
// These map to a single Korean initial consonant (the ɹ/l is absorbed)
const CONSONANT_CLUSTERS: Record<string, number> = {
  'pɹ': 17, // ㅍ (pr → 프)
  'bɹ': 7,  // ㅂ (br → 브)
  'tɹ': 16, // ㅌ (tr → 트)
  'dɹ': 3,  // ㄷ (dr → 드)
  'kɹ': 15, // ㅋ (kr → 크)
  'gɹ': 0,  // ㄱ (gr → 그)
  'fɹ': 17, // ㅍ (fr → 프)
  'θɹ': 9,  // ㅅ (thr → 쓰)
  'ʃɹ': 9,  // ㅅ (shr → 슈)
  'pl': 17, // ㅍ (pl → 플)
  'bl': 7,  // ㅂ (bl → 블)
  'kl': 15, // ㅋ (kl → 클)
  'gl': 0,  // ㄱ (gl → 글)
  'fl': 17, // ㅍ (fl → 플)
  'sl': 9,  // ㅅ (sl → 슬)
};

// IPA consonant to Korean Choseong (초성) index
const CONSONANT_TO_CHOSEONG: Record<string, number> = {
  'p': 17, // ㅍ
  'b': 7,  // ㅂ
  't': 16, // ㅌ
  'd': 3,  // ㄷ
  'k': 15, // ㅋ
  'g': 0,  // ㄱ
  'm': 6,  // ㅁ
  'n': 2,  // ㄴ
  'ŋ': 11, // ㅇ
  'f': 17, // ㅍ
  'v': 7,  // ㅂ
  'θ': 9,  // ㅅ
  'ð': 3,  // ㄷ
  's': 9,  // ㅅ
  'z': 12, // ㅈ
  'ʃ': 9,  // ㅅ
  'ʒ': 12, // ㅈ
  'h': 18, // ㅎ
  'tʃ': 14, // ㅊ
  'dʒ': 12, // ㅈ
  'l': 5,  // ㄹ
  'r': 5,  // ㄹ
  'ɹ': 5,  // ㄹ
  'w': 11, // ㅇ (use ㅇ for w, will combine with vowel)
  'j': 11, // ㅇ (use ㅇ for j, will combine with vowel)
};

// IPA consonant to Korean Jongseong (종성) index
const CONSONANT_TO_JONGSEONG: Record<string, number> = {
  'p': 17, // ㅂ
  'b': 17, // ㅂ
  't': 25, // ㅌ
  'd': 7,  // ㄷ
  'k': 1,  // ㄱ
  'g': 1,  // ㄱ
  'm': 16, // ㅁ
  'n': 4,  // ㄴ
  'ŋ': 21, // ㅇ
  'f': 26, // ㅍ
  'v': 17, // ㅂ
  'θ': 19, // ㅅ
  'ð': 7,  // ㄷ
  's': 19, // ㅅ
  'z': 22, // ㅈ
  'ʃ': 19, // ㅅ
  'ʒ': 22, // ㅈ
  'l': 8,  // ㄹ
  'r': 8,  // ㄹ
  'ɹ': 8,  // ㄹ
  'tʃ': 23, // ㅊ
  'dʒ': 22, // ㅈ
};

// IPA vowel to Korean Jungseong (중성) - returns array for diphthongs
const VOWEL_TO_JUNGSEONG: Record<string, number[]> = {
  // Simple vowels
  'iː': [20],      // ㅣ
  'i': [20],       // ㅣ
  'ɪ': [20],       // ㅣ
  'e': [5],        // ㅔ
  'ɛ': [5],        // ㅔ
  'æ': [1],        // ㅐ
  'ɑː': [0],       // ㅏ
  'ɑ': [0],        // ㅏ
  'ɒ': [8],        // ㅗ
  'ɔː': [8],       // ㅗ
  'ɔ': [8],        // ㅗ
  'ʌ': [4],        // ㅓ
  'ə': [4],        // ㅓ
  'ɜː': [4],       // ㅓ
  'ɜ': [4],        // ㅓ
  'ʊ': [13],       // ㅜ
  'uː': [13],      // ㅜ
  'u': [13],       // ㅜ

  // Diphthongs - create two syllables
  'eɪ': [5, 20],   // ㅔ + ㅣ = 에이
  'aɪ': [0, 20],   // ㅏ + ㅣ = 아이
  'ɔɪ': [8, 20],   // ㅗ + ㅣ = 오이
  'aʊ': [0, 13],   // ㅏ + ㅜ = 아우
  'əʊ': [8],       // ㅗ (simplified)
  'oʊ': [8],       // ㅗ (simplified)
  'ɪə': [20, 4],   // ㅣ + ㅓ = 이어
  'eə': [5, 4],    // ㅔ + ㅓ = 에어
  'ʊə': [13, 4],   // ㅜ + ㅓ = 우어
};

/**
 * Create a Hangul syllable from Jamo components
 */
function assembleHangul(cho: number, jung: number, jong: number = 0): string {
  const code = 0xAC00 + (cho * 588) + (jung * 28) + jong;
  return String.fromCharCode(code);
}

/**
 * Wrap syllable with <strong> tag if stressed
 */
function wrapIfStressed(syllable: string, isStressed: boolean): string {
  return isStressed ? `<strong>${syllable}</strong>` : syllable;
}

/**
 * Check if a character is a vowel in IPA
 */
function isVowelIPA(char: string, text: string, index: number): boolean {
  // Check single char
  if (VOWEL_TO_JUNGSEONG[char]) return true;

  // Check 2-char combinations
  const twoChar = text.substring(index, index + 2);
  if (VOWEL_TO_JUNGSEONG[twoChar]) return true;

  // Check 3-char combinations
  const threeChar = text.substring(index, index + 3);
  if (VOWEL_TO_JUNGSEONG[threeChar]) return true;

  return false;
}

/**
 * Convert IPA notation to Korean pronunciation with stress marking
 */
export function ipaToKorean(ipa: string | undefined): string {
  if (!ipa) return '';

  // Parse IPA and track stress positions
  const stressPositions = new Set<number>();
  let cleanedText = '';

  for (let idx = 0; idx < ipa.length; idx++) {
    const char = ipa[idx];

    // Mark stress position (before next character)
    if (char === 'ˈ' || char === 'ˌ' || char === '′' || char === "'") {
      stressPositions.add(cleanedText.length);
    }
    // Skip delimiters and syllable breaks
    else if (char === '/' || char === '[' || char === ']' || char === '.') {
      continue;
    }
    // Keep actual IPA characters
    else {
      cleanedText += char;
    }
  }

  const text = cleanedText.trim();
  if (!text) return '';

  const result: string[] = [];
  let i = 0;
  let nextSyllableStressed = stressPositions.has(i);

  while (i < text.length) {
    // Try to match consonant (including clusters and digraphs)
    let consonantLen = 0;
    let choIdx: number | null = null;

    // 1. Try consonant clusters first (pɹ, tɹ, etc.) - HIGHEST PRIORITY
    const twoChar = text.substring(i, i + 2);
    if (CONSONANT_CLUSTERS[twoChar] !== undefined) {
      choIdx = CONSONANT_CLUSTERS[twoChar];
      consonantLen = 2;
    }
    // 2. Try 2-char consonants (tʃ, dʒ)
    else if (CONSONANT_TO_CHOSEONG[twoChar] !== undefined) {
      choIdx = CONSONANT_TO_CHOSEONG[twoChar];
      consonantLen = 2;
    }
    // 3. Try single consonant
    else {
      const oneChar = text[i];
      if (CONSONANT_TO_CHOSEONG[oneChar] !== undefined) {
        choIdx = CONSONANT_TO_CHOSEONG[oneChar];
        consonantLen = 1;
      }
    }

    if (choIdx !== null) {
      i += consonantLen;

      // Look for following vowel
      let vowel: string | null = null;
      let vowelLen = 0;

      // Try 3-char vowels first
      for (let len = 3; len >= 1; len--) {
        const vowelStr = text.substring(i, i + len);
        if (VOWEL_TO_JUNGSEONG[vowelStr] !== undefined) {
          vowel = vowelStr;
          vowelLen = len;
          break;
        }
      }

      if (vowel !== null) {
        const jungIndices = VOWEL_TO_JUNGSEONG[vowel];
        i += vowelLen;

        // Check for trailing consonant (jongseong)
        let jongIdx = 0;
        const nextChar = text[i];
        const nextNextChar = text[i + 1];

        // Try 2-char consonant
        const nextTwoChar = text.substring(i, i + 2);
        if (CONSONANT_TO_JONGSEONG[nextTwoChar] !== undefined) {
          // Check if it should be jongseong or start of next syllable
          const afterIdx = i + 2;
          const isVowelAfter = afterIdx < text.length && isVowelIPA(text[afterIdx], text, afterIdx);

          if (!isVowelAfter) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextTwoChar];
            i += 2;
          }
        } else if (nextChar && CONSONANT_TO_JONGSEONG[nextChar] !== undefined) {
          // Check if next char is start of new syllable
          const isVowelAfter = nextNextChar && isVowelIPA(nextNextChar, text, i + 1);

          if (!isVowelAfter) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextChar];
            i += 1;
          }
        }

        // Assemble syllable(s)
        if (jungIndices.length === 1) {
          // Simple vowel
          const syllable = assembleHangul(choIdx, jungIndices[0], jongIdx);
          result.push(wrapIfStressed(syllable, nextSyllableStressed));
          nextSyllableStressed = false;
        } else {
          // Diphthong - create two syllables
          const firstSyllable = assembleHangul(choIdx, jungIndices[0], 0);
          result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
          nextSyllableStressed = false;
          result.push(assembleHangul(11, jungIndices[1], jongIdx)); // 11 = ㅇ (null initial)
        }

        // Update stress flag for next position
        if (stressPositions.has(i)) {
          nextSyllableStressed = true;
        }
      } else {
        // Consonant without vowel - use default ㅡ
        const syllable = assembleHangul(choIdx, 18, 0); // 18 = ㅡ
        result.push(wrapIfStressed(syllable, nextSyllableStressed));
        nextSyllableStressed = false;

        // Update stress flag for next position
        if (stressPositions.has(i)) {
          nextSyllableStressed = true;
        }
      }
      continue;
    }

    // Try vowel without initial consonant
    let vowel: string | null = null;
    let vowelLen = 0;

    for (let len = 3; len >= 1; len--) {
      const vowelStr = text.substring(i, i + len);
      if (VOWEL_TO_JUNGSEONG[vowelStr] !== undefined) {
        vowel = vowelStr;
        vowelLen = len;
        break;
      }
    }

    if (vowel !== null) {
      const jungIndices = VOWEL_TO_JUNGSEONG[vowel];
      i += vowelLen;

      // Check for trailing consonant
      let jongIdx = 0;
      const nextChar = text[i];
      const nextNextChar = text[i + 1];

      const nextTwoChar = text.substring(i, i + 2);
      if (CONSONANT_TO_JONGSEONG[nextTwoChar] !== undefined) {
        const afterIdx = i + 2;
        const isVowelAfter = afterIdx < text.length && isVowelIPA(text[afterIdx], text, afterIdx);

        if (!isVowelAfter) {
          jongIdx = CONSONANT_TO_JONGSEONG[nextTwoChar];
          i += 2;
        }
      } else if (nextChar && CONSONANT_TO_JONGSEONG[nextChar] !== undefined) {
        const isVowelAfter = nextNextChar && isVowelIPA(nextNextChar, text, i + 1);

        if (!isVowelAfter) {
          jongIdx = CONSONANT_TO_JONGSEONG[nextChar];
          i += 1;
        }
      }

      // Assemble syllable(s) with ㅇ (null initial)
      if (jungIndices.length === 1) {
        const syllable = assembleHangul(11, jungIndices[0], jongIdx); // 11 = ㅇ
        result.push(wrapIfStressed(syllable, nextSyllableStressed));
        nextSyllableStressed = false;
      } else {
        const firstSyllable = assembleHangul(11, jungIndices[0], 0);
        result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
        nextSyllableStressed = false;
        result.push(assembleHangul(11, jungIndices[1], jongIdx));
      }

      // Update stress flag for next position
      if (stressPositions.has(i)) {
        nextSyllableStressed = true;
      }
      continue;
    }

    // Unknown character, skip
    i++;
  }

  return result.join('');
}

/**
 * Format pronunciation for display
 */
export function formatPronunciation(ipa: string | undefined): { korean: string; ipa: string } {
  const korean = ipaToKorean(ipa);
  const cleanIpa = ipa || '';

  return {
    korean,
    ipa: cleanIpa
  };
}

/**
 * Get only Korean pronunciation
 */
export function getKoreanPronunciation(ipa: string | undefined): string {
  return ipaToKorean(ipa);
}
