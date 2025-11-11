/**
 * IPA (International Phonetic Alphabet) to Korean (Hangul) pronunciation converter
 * Converts English IPA notation to approximate Korean pronunciation using Jamo assembly
 *
 * Korean Jamo indices reference:
 * Choseong (초성): ㄱ(0) ㄲ(1) ㄴ(2) ㄷ(3) ㄸ(4) ㄹ(5) ㅁ(6) ㅂ(7) ㅃ(8) ㅅ(9) ㅆ(10) ㅇ(11) ㅈ(12) ㅉ(13) ㅊ(14) ㅋ(15) ㅌ(16) ㅍ(17) ㅎ(18)
 * Jungseong (중성): ㅏ(0) ㅐ(1) ㅑ(2) ㅒ(3) ㅓ(4) ㅔ(5) ㅕ(6) ㅖ(7) ㅗ(8) ㅘ(9) ㅙ(10) ㅚ(11) ㅛ(12) ㅜ(13) ㅝ(14) ㅞ(15) ㅟ(16) ㅠ(17) ㅡ(18) ㅢ(19) ㅣ(20)
 * Jongseong (종성): (none)(0) ㄱ(1) ㄲ(2) ㄳ(3) ㄴ(4) ㄵ(5) ㄶ(6) ㄷ(7) ㄹ(8) ㄺ(9) ㄻ(10) ㄼ(11) ㄽ(12) ㄾ(13) ㄿ(14) ㅀ(15) ㅁ(16) ㅂ(17) ㅄ(18) ㅅ(19) ㅆ(20) ㅇ(21) ㅈ(22) ㅊ(23) ㅋ(24) ㅌ(25) ㅍ(26) ㅎ(27)
 */

// Choseong (초성) index constants for readability
const CHOSEONG = {
  GIYEOK: 0,   // ㄱ
  SSANGGIYEOK: 1,  // ㄲ
  NIEUN: 2,    // ㄴ
  DIGEUT: 3,   // ㄷ
  SSANGDIGEUT: 4,  // ㄸ
  RIEUL: 5,    // ㄹ
  MIEUM: 6,    // ㅁ
  BIEUP: 7,    // ㅂ
  SSANGBIEUP: 8,   // ㅃ
  SIOS: 9,     // ㅅ
  SSANGSIOS: 10,   // ㅆ
  IEUNG: 11,   // ㅇ
  JIEUT: 12,   // ㅈ
  SSANGJIEUT: 13,  // ㅉ
  CHIEUT: 14,  // ㅊ
  KIEUK: 15,   // ㅋ
  TIEUT: 16,   // ㅌ
  PIEUP: 17,   // ㅍ
  HIEUT: 18,   // ㅎ
} as const;

// Jungseong (중성) index constants for readability
const JUNGSEONG = {
  A: 0,        // ㅏ
  AE: 1,       // ㅐ
  YA: 2,       // ㅑ
  YAE: 3,      // ㅒ
  EO: 4,       // ㅓ
  E: 5,        // ㅔ
  YEO: 6,      // ㅕ
  YE: 7,       // ㅖ
  O: 8,        // ㅗ
  WA: 9,       // ㅘ
  WAE: 10,     // ㅙ
  OE: 11,      // ㅚ
  YO: 12,      // ㅛ
  U: 13,       // ㅜ
  WO: 14,      // ㅝ
  WE: 15,      // ㅞ
  WI: 16,      // ㅟ
  YU: 17,      // ㅠ
  EU: 18,      // ㅡ
  UI: 19,      // ㅢ
  I: 20,       // ㅣ
} as const;

// Consonant clusters - these need to be split into two syllables
// Format: [first consonant cho index, second consonant cho index]
// Example: pɹ → p(ㅍ) + ㅡ + ɹ(ㄹ) → 프 + ㄹ... → 프라/프리/etc
const CONSONANT_CLUSTERS: Record<string, [number, number]> = {
  'pɹ': [CHOSEONG.PIEUP, CHOSEONG.RIEUL],   // ㅍ + ㄹ (pr → 프르)
  'bɹ': [CHOSEONG.BIEUP, CHOSEONG.RIEUL],   // ㅂ + ㄹ (br → 브르)
  'tɹ': [CHOSEONG.TIEUT, CHOSEONG.RIEUL],   // ㅌ + ㄹ (tr → 트르)
  'dɹ': [CHOSEONG.DIGEUT, CHOSEONG.RIEUL],  // ㄷ + ㄹ (dr → 드르)
  'kɹ': [CHOSEONG.KIEUK, CHOSEONG.RIEUL],   // ㅋ + ㄹ (kr → 크르)
  'gɹ': [CHOSEONG.GIYEOK, CHOSEONG.RIEUL],  // ㄱ + ㄹ (gr → 그르)
  'fɹ': [CHOSEONG.PIEUP, CHOSEONG.RIEUL],   // ㅍ + ㄹ (fr → 프르)
  'θɹ': [CHOSEONG.SIOS, CHOSEONG.RIEUL],    // ㅅ + ㄹ (thr → 스르)
  'ʃɹ': [CHOSEONG.SIOS, CHOSEONG.RIEUL],    // ㅅ + ㄹ (shr → 슈르)
  'pl': [CHOSEONG.PIEUP, CHOSEONG.RIEUL],   // ㅍ + ㄹ (pl → 플)
  'bl': [CHOSEONG.BIEUP, CHOSEONG.RIEUL],   // ㅂ + ㄹ (bl → 블)
  'kl': [CHOSEONG.KIEUK, CHOSEONG.RIEUL],   // ㅋ + ㄹ (kl → 클)
  'gl': [CHOSEONG.GIYEOK, CHOSEONG.RIEUL],  // ㄱ + ㄹ (gl → 글)
  'fl': [CHOSEONG.PIEUP, CHOSEONG.RIEUL],   // ㅍ + ㄹ (fl → 플)
  'sl': [CHOSEONG.SIOS, CHOSEONG.RIEUL],    // ㅅ + ㄹ (sl → 슬)
};

// IPA consonant to Korean Choseong (초성) index
const CONSONANT_TO_CHOSEONG: Record<string, number> = {
  'p': CHOSEONG.PIEUP,   // ㅍ
  'b': CHOSEONG.BIEUP,   // ㅂ
  't': CHOSEONG.TIEUT,   // ㅌ
  'd': CHOSEONG.DIGEUT,  // ㄷ
  'k': CHOSEONG.KIEUK,   // ㅋ
  'g': CHOSEONG.GIYEOK,  // ㄱ
  'm': CHOSEONG.MIEUM,   // ㅁ
  'n': CHOSEONG.NIEUN,   // ㄴ
  'ŋ': CHOSEONG.IEUNG,   // ㅇ
  'f': CHOSEONG.PIEUP,   // ㅍ
  'v': CHOSEONG.BIEUP,   // ㅂ
  'θ': CHOSEONG.SIOS,    // ㅅ
  'ð': CHOSEONG.DIGEUT,  // ㄷ
  's': CHOSEONG.SIOS,    // ㅅ
  'z': CHOSEONG.JIEUT,   // ㅈ
  'ʃ': CHOSEONG.SIOS,    // ㅅ
  'ʒ': CHOSEONG.JIEUT,   // ㅈ
  'h': CHOSEONG.HIEUT,   // ㅎ
  'tʃ': CHOSEONG.CHIEUT, // ㅊ
  'dʒ': CHOSEONG.JIEUT,  // ㅈ
  'l': CHOSEONG.RIEUL,   // ㄹ
  'r': CHOSEONG.RIEUL,   // ㄹ
  'ɹ': CHOSEONG.RIEUL,   // ㄹ
  'w': CHOSEONG.IEUNG,   // ㅇ (use ㅇ for w, will combine with vowel)
  'j': CHOSEONG.IEUNG,   // ㅇ (use ㅇ for j, will combine with vowel)
};

// Jongseong (종성) index constants for readability
const JONGSEONG = {
  NONE: 0,    // 종성 없음
  GIYEOK: 1,  // ㄱ
  NIEUN: 4,   // ㄴ
  DIGEUT: 7,  // ㄷ
  RIEUL: 8,   // ㄹ
  MIEUM: 16,  // ㅁ
  BIEUP: 17,  // ㅂ
  SIOS: 19,   // ㅅ
  IEUNG: 21,  // ㅇ
  JIEUT: 22,  // ㅈ
  CHIEUT: 23, // ㅊ
  TIEUT: 25,  // ㅌ
  PIEUP: 26,  // ㅍ
} as const;

// IPA consonant to Korean Jongseong (종성) index
const CONSONANT_TO_JONGSEONG: Record<string, number> = {
  'p': JONGSEONG.BIEUP,  // ㅂ
  'b': JONGSEONG.BIEUP,  // ㅂ
  't': JONGSEONG.TIEUT,  // ㅌ
  'd': JONGSEONG.DIGEUT, // ㄷ
  'k': JONGSEONG.GIYEOK, // ㄱ
  'g': JONGSEONG.GIYEOK, // ㄱ
  'm': JONGSEONG.MIEUM,  // ㅁ
  'n': JONGSEONG.NIEUN,  // ㄴ
  'ŋ': JONGSEONG.IEUNG,  // ㅇ
  'f': JONGSEONG.PIEUP,  // ㅍ
  'v': JONGSEONG.BIEUP,  // ㅂ
  'θ': JONGSEONG.SIOS,   // ㅅ
  'ð': JONGSEONG.DIGEUT, // ㄷ
  's': JONGSEONG.SIOS,   // ㅅ
  'z': JONGSEONG.JIEUT,  // ㅈ
  'ʃ': JONGSEONG.SIOS,   // ㅅ
  'ʒ': JONGSEONG.JIEUT,  // ㅈ
  'l': JONGSEONG.RIEUL,  // ㄹ
  'r': JONGSEONG.RIEUL,  // ㄹ
  'ɹ': JONGSEONG.RIEUL,  // ㄹ
  'tʃ': JONGSEONG.CHIEUT, // ㅊ
  'dʒ': JONGSEONG.JIEUT,  // ㅈ
};

// IPA vowel to Korean Jungseong (중성) - returns array for diphthongs
const VOWEL_TO_JUNGSEONG: Record<string, number[]> = {
  // w + vowel combinations (semi-vowel w)
  'wɜː': [JUNGSEONG.WO],     // ㅝ (wer → 워)
  'wɜ': [JUNGSEONG.WO],      // ㅝ (wer → 워)
  'wə': [JUNGSEONG.WO],      // ㅝ (wuh → 워)
  'wɔː': [JUNGSEONG.WO],     // ㅝ (wor → 워)
  'wɔ': [JUNGSEONG.WO],      // ㅝ (wor → 워)
  'wɑː': [JUNGSEONG.WA],     // ㅘ (war → 와)
  'wɑ': [JUNGSEONG.WA],      // ㅘ (war → 와)
  'wɪ': [JUNGSEONG.WI],      // ㅟ (wi → 위)
  'wi': [JUNGSEONG.WI],      // ㅟ (wi → 위)
  'weɪ': [JUNGSEONG.WE],     // ㅞ (way → 웨이) - but eɪ part needs handling

  // j + vowel combinations (semi-vowel j/y)
  'juː': [JUNGSEONG.YU],     // ㅠ (yu → 유)
  'ju': [JUNGSEONG.YU],      // ㅠ (yu → 유)
  'jə': [JUNGSEONG.YEO],     // ㅕ (yuh → 여)
  'jɛ': [JUNGSEONG.YEO],     // ㅕ (yeh → 여)
  'jɑː': [JUNGSEONG.YA],     // ㅑ (ya → 야)
  'jɑ': [JUNGSEONG.YA],      // ㅑ (ya → 야)
  'jɔː': [JUNGSEONG.YO],     // ㅛ (yo → 요)
  'jɔ': [JUNGSEONG.YO],      // ㅛ (yo → 요)
  'ji': [JUNGSEONG.I],       // ㅣ (yi → 이)
  'jɪ': [JUNGSEONG.I],       // ㅣ (yi → 이)

  // Simple vowels
  'iː': [JUNGSEONG.I],       // ㅣ
  'i': [JUNGSEONG.I],        // ㅣ
  'ɪ': [JUNGSEONG.I],        // ㅣ
  'e': [JUNGSEONG.E],        // ㅔ
  'ɛ': [JUNGSEONG.E],        // ㅔ
  'æ': [JUNGSEONG.AE],       // ㅐ
  'ɑː': [JUNGSEONG.A],       // ㅏ
  'ɑ': [JUNGSEONG.A],        // ㅏ
  'ɒ': [JUNGSEONG.O],        // ㅗ
  'ɔː': [JUNGSEONG.O],       // ㅗ
  'ɔ': [JUNGSEONG.O],        // ㅗ
  'ʌ': [JUNGSEONG.EO],       // ㅓ
  'ə': [JUNGSEONG.EO],       // ㅓ
  'ɜː': [JUNGSEONG.EO],      // ㅓ
  'ɜ': [JUNGSEONG.EO],       // ㅓ
  'ɝ': [JUNGSEONG.EO],       // ㅓ (rhotic schwa, American English r-colored)
  'ʊ': [JUNGSEONG.U],        // ㅜ
  'uː': [JUNGSEONG.U],       // ㅜ
  'u': [JUNGSEONG.U],        // ㅜ

  // Syllabic consonants (act as vowel + consonant)
  'l̩': [JUNGSEONG.EU],       // ㅡ (syllabic L: will add ㄹ as jongseong)
  'n̩': [JUNGSEONG.EU],       // ㅡ (syllabic N: will add ㄴ as jongseong)
  'm̩': [JUNGSEONG.EU],       // ㅡ (syllabic M: will add ㅁ as jongseong)

  // Diphthongs - create two syllables
  'eɪ': [JUNGSEONG.E, JUNGSEONG.I],   // ㅔ + ㅣ = 에이
  'aɪ': [JUNGSEONG.A, JUNGSEONG.I],   // ㅏ + ㅣ = 아이
  'ɔɪ': [JUNGSEONG.O, JUNGSEONG.I],   // ㅗ + ㅣ = 오이
  'aʊ': [JUNGSEONG.A, JUNGSEONG.U],   // ㅏ + ㅜ = 아우
  'əʊ': [JUNGSEONG.O],                 // ㅗ (simplified)
  'oʊ': [JUNGSEONG.O],                 // ㅗ (simplified)
  'ɪə': [JUNGSEONG.I, JUNGSEONG.EO],  // ㅣ + ㅓ = 이어
  'eə': [JUNGSEONG.E, JUNGSEONG.EO],  // ㅔ + ㅓ = 에어
  'ʊə': [JUNGSEONG.U, JUNGSEONG.EO],  // ㅜ + ㅓ = 우어
};

/**
 * Create a Hangul syllable from Jamo components
 */
function assembleHangul(cho: number, jung: number, jong: number = JONGSEONG.NONE): string {
  const code = 0xAC00 + (cho * 588) + (jung * 28) + jong;
  return String.fromCharCode(code);
}

/**
 * Wrap syllable with <strong> tag if stressed
 * Uses color (blue-600/blue-400), extra bold weight, and slightly larger size for emphasis
 * Automatically adapts to light/dark mode via Tailwind classes
 */
function wrapIfStressed(syllable: string, isStressed: boolean): string {
  return isStressed
    ? `<strong class="text-blue-600 dark:text-blue-400 font-black text-[1.1em]">${syllable}</strong>`
    : syllable;
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
 * Check if there's a consonant cluster starting at this position
 */
function isConsonantCluster(text: string, index: number): boolean {
  const twoChar = text.substring(index, index + 2);
  return CONSONANT_CLUSTERS[twoChar] !== undefined;
}

/**
 * Check if the next character should start a new syllable
 * (either a vowel or part of a consonant cluster)
 */
function isNewSyllableStart(text: string, index: number): boolean {
  if (index >= text.length) return false;
  return isVowelIPA(text[index], text, index) || isConsonantCluster(text, index);
}

/**
 * Convert IPA notation to Korean pronunciation with stress marking
 */
export function ipaToKorean(ipa: string | undefined): string {
  if (!ipa) return '';

  // Remove optional sounds (parentheses and their content)
  let preprocessed = ipa.replace(/\([^)]*\)/g, '');

  // Parse IPA and track stress positions
  const stressPositions = new Set<number>();
  let cleanedText = '';

  for (let idx = 0; idx < preprocessed.length; idx++) {
    const char = preprocessed[idx];

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
    // 1. Check for consonant clusters FIRST (pɹ, tɹ, etc.)
    const twoChar = text.substring(i, i + 2);
    if (CONSONANT_CLUSTERS[twoChar] !== undefined) {
      const [firstCho, secondCho] = CONSONANT_CLUSTERS[twoChar];
      i += 2;

      // Create first syllable: consonant + ㅡ (e.g., 트)
      const firstSyllable = assembleHangul(firstCho, JUNGSEONG.EU, JONGSEONG.NONE);
      result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
      nextSyllableStressed = false;

      // Update stress flag
      if (stressPositions.has(i)) {
        nextSyllableStressed = true;
      }

      // Look for following vowel for second syllable
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

        // Check for trailing consonant (both simple and diphthongs)
        let jongIdx = 0;
        let consonantConsumed = 0;

        const nextChar = text[i];
        const nextNextChar = text[i + 1];

        const nextTwoChar = text.substring(i, i + 2);
        if (CONSONANT_TO_JONGSEONG[nextTwoChar] !== undefined) {
          const afterIdx = i + 2;
          const startsNewSyllable = isNewSyllableStart(text, afterIdx);
          if (!startsNewSyllable) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextTwoChar];
            consonantConsumed = 2;
          }
        } else if (nextChar && CONSONANT_TO_JONGSEONG[nextChar] !== undefined) {
          // Check if consonant is followed by a vowel (then it's initial of next syllable)
          const hasVowelAfter = nextNextChar && isVowelIPA(nextNextChar, text, i + 1);
          const hasClusterAfter = isConsonantCluster(text, i);

          if (!hasVowelAfter && !hasClusterAfter) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextChar];
            consonantConsumed = 1;
          }
        }

        // Create second syllable (e.g., 리)
        if (jungIndices.length === 1) {
          i += consonantConsumed;
          const syllable = assembleHangul(secondCho, jungIndices[0], jongIdx);
          result.push(wrapIfStressed(syllable, nextSyllableStressed));
          nextSyllableStressed = false;
        } else {
          // Diphthong - attach jongseong to second syllable (타임, not 타이므)
          i += consonantConsumed;
          const firstSyllable = assembleHangul(secondCho, jungIndices[0], JONGSEONG.NONE);
          result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
          nextSyllableStressed = false;
          result.push(assembleHangul(CHOSEONG.IEUNG, jungIndices[1], jongIdx));
        }

        // Update stress flag
        if (stressPositions.has(i)) {
          nextSyllableStressed = true;
        }
      } else {
        // No vowel after cluster, use default ㅡ for second consonant
        const syllable = assembleHangul(secondCho, JUNGSEONG.EU, JONGSEONG.NONE);
        result.push(wrapIfStressed(syllable, nextSyllableStressed));
        nextSyllableStressed = false;

        // Update stress flag
        if (stressPositions.has(i)) {
          nextSyllableStressed = true;
        }
      }
      continue;
    }

    // 2. Check for semi-vowels (w, j) + vowel combinations
    const currentChar = text[i];
    if (currentChar === 'w' || currentChar === 'j') {
      // Try longer combinations first (up to 4 chars: w + 3-char vowel)
      let semiVowelCombo: string | null = null;
      let comboLen = 0;

      for (let len = 4; len >= 2; len--) {
        const testCombo = text.substring(i, i + len);
        if (VOWEL_TO_JUNGSEONG[testCombo] !== undefined) {
          semiVowelCombo = testCombo;
          comboLen = len;
          break;
        }
      }

      if (semiVowelCombo !== null) {
        // Found w/j + vowel combination, treat as vowel-only syllable
        const jungIndices = VOWEL_TO_JUNGSEONG[semiVowelCombo];
        i += comboLen;

        // For diphthongs, don't check for trailing consonants
        let jongIdx = 0;
        let consonantConsumed = 0;

        if (jungIndices.length === 1) {
          const nextChar = text[i];
          const nextTwoChar = text.substring(i, i + 2);
          if (CONSONANT_TO_JONGSEONG[nextTwoChar] !== undefined) {
            const afterIdx = i + 2;
            const startsNewSyllable = isNewSyllableStart(text, afterIdx);
            if (!startsNewSyllable) {
              jongIdx = CONSONANT_TO_JONGSEONG[nextTwoChar];
              consonantConsumed = 2;
            }
          } else if (nextChar && CONSONANT_TO_JONGSEONG[nextChar] !== undefined) {
            const startsNewSyllable = isNewSyllableStart(text, i);
            if (!startsNewSyllable) {
              jongIdx = CONSONANT_TO_JONGSEONG[nextChar];
              consonantConsumed = 1;
            }
          }
        }

        // Create syllable(s) with ㅇ (null initial)
        if (jungIndices.length === 1) {
          i += consonantConsumed;

          // Check if this is a syllabic consonant that needs automatic jongseong
          let autoJongIdx = jongIdx;
          if (semiVowelCombo === 'l̩' && autoJongIdx === JONGSEONG.NONE) {
            autoJongIdx = JONGSEONG.RIEUL; // ㄹ
          } else if (semiVowelCombo === 'n̩' && autoJongIdx === JONGSEONG.NONE) {
            autoJongIdx = JONGSEONG.NIEUN; // ㄴ
          } else if (semiVowelCombo === 'm̩' && autoJongIdx === JONGSEONG.NONE) {
            autoJongIdx = JONGSEONG.MIEUM; // ㅁ
          }

          const syllable = assembleHangul(CHOSEONG.IEUNG, jungIndices[0], autoJongIdx);
          result.push(wrapIfStressed(syllable, nextSyllableStressed));
          nextSyllableStressed = false;
        } else {
          // Diphthong - attach jongseong to second syllable
          i += consonantConsumed;
          const firstSyllable = assembleHangul(CHOSEONG.IEUNG, jungIndices[0], JONGSEONG.NONE);
          result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
          nextSyllableStressed = false;
          result.push(assembleHangul(CHOSEONG.IEUNG, jungIndices[1], jongIdx));
        }

        // Update stress flag
        if (stressPositions.has(i)) {
          nextSyllableStressed = true;
        }
        continue;
      }
    }

    // 3. Try 2-char consonants (tʃ, dʒ)
    let consonantLen = 0;
    let choIdx: number | null = null;

    if (CONSONANT_TO_CHOSEONG[twoChar] !== undefined) {
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

        // Check for trailing consonant (both simple and diphthongs)
        let jongIdx = 0;
        let consonantConsumed = 0;

        const nextChar = text[i];
        const nextNextChar = text[i + 1];

        // Try 2-char consonant
        const nextTwoChar = text.substring(i, i + 2);
        if (CONSONANT_TO_JONGSEONG[nextTwoChar] !== undefined) {
          const afterIdx = i + 2;
          const startsNewSyllable = isNewSyllableStart(text, afterIdx);

          if (!startsNewSyllable) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextTwoChar];
            consonantConsumed = 2;
          }
        } else if (nextChar && CONSONANT_TO_JONGSEONG[nextChar] !== undefined) {
          // Check if consonant is followed by a vowel (then it's initial of next syllable)
          const hasVowelAfter = nextNextChar && isVowelIPA(nextNextChar, text, i + 1);
          const hasClusterAfter = isConsonantCluster(text, i);

          if (!hasVowelAfter && !hasClusterAfter) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextChar];
            consonantConsumed = 1;
          }
        }

        // Assemble syllable(s)
        if (jungIndices.length === 1) {
          // Simple vowel
          i += consonantConsumed;

          // Check if this is a syllabic consonant that needs automatic jongseong
          let autoJongIdx = jongIdx;
          if (vowel === 'l̩' && autoJongIdx === JONGSEONG.NONE) {
            autoJongIdx = JONGSEONG.RIEUL; // ㄹ
          } else if (vowel === 'n̩' && autoJongIdx === JONGSEONG.NONE) {
            autoJongIdx = JONGSEONG.NIEUN; // ㄴ
          } else if (vowel === 'm̩' && autoJongIdx === JONGSEONG.NONE) {
            autoJongIdx = JONGSEONG.MIEUM; // ㅁ
          }

          const syllable = assembleHangul(choIdx, jungIndices[0], autoJongIdx);
          result.push(wrapIfStressed(syllable, nextSyllableStressed));
          nextSyllableStressed = false;
        } else {
          // Diphthong - attach jongseong to second syllable (타임, not 타이므)
          i += consonantConsumed;
          const firstSyllable = assembleHangul(choIdx, jungIndices[0], JONGSEONG.NONE);
          result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
          nextSyllableStressed = false;
          result.push(assembleHangul(CHOSEONG.IEUNG, jungIndices[1], jongIdx));
        }

        // Update stress flag for next position
        if (stressPositions.has(i)) {
          nextSyllableStressed = true;
        }
      } else {
        // Consonant without vowel - use default ㅡ
        const syllable = assembleHangul(choIdx, JUNGSEONG.EU, JONGSEONG.NONE);
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

      // For diphthongs, don't check for trailing consonants
      let jongIdx = 0;
      let consonantConsumed = 0;

      if (jungIndices.length === 1) {
        const nextChar = text[i];
        const nextNextChar = text[i + 1];

        const nextTwoChar = text.substring(i, i + 2);
        if (CONSONANT_TO_JONGSEONG[nextTwoChar] !== undefined) {
          const afterIdx = i + 2;
          const isVowelAfter = afterIdx < text.length && isVowelIPA(text[afterIdx], text, afterIdx);

          if (!isVowelAfter) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextTwoChar];
            consonantConsumed = 2;
          }
        } else if (nextChar && CONSONANT_TO_JONGSEONG[nextChar] !== undefined) {
          const isVowelAfter = nextNextChar && isVowelIPA(nextNextChar, text, i + 1);

          if (!isVowelAfter) {
            jongIdx = CONSONANT_TO_JONGSEONG[nextChar];
            consonantConsumed = 1;
          }
        }
      }

      // Assemble syllable(s) with ㅇ (null initial)
      if (jungIndices.length === 1) {
        i += consonantConsumed;
        const syllable = assembleHangul(CHOSEONG.IEUNG, jungIndices[0], jongIdx);
        result.push(wrapIfStressed(syllable, nextSyllableStressed));
        nextSyllableStressed = false;
      } else {
        // Diphthong - no jongseong
        const firstSyllable = assembleHangul(CHOSEONG.IEUNG, jungIndices[0], JONGSEONG.NONE);
        result.push(wrapIfStressed(firstSyllable, nextSyllableStressed));
        nextSyllableStressed = false;
        result.push(assembleHangul(CHOSEONG.IEUNG, jungIndices[1], JONGSEONG.NONE));
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
