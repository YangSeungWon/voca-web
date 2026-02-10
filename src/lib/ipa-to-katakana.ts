/**
 * IPA to Katakana conversion for Japanese users
 * Converts English IPA pronunciation to Japanese Katakana approximation
 */

// Vowel mappings (order matters - longer patterns first)
const vowelMap: [RegExp, string][] = [
  // Diphthongs
  [/eɪ/g, 'エイ'],
  [/aɪ/g, 'アイ'],
  [/ɔɪ/g, 'オイ'],
  [/aʊ/g, 'アウ'],
  [/əʊ/g, 'オウ'],
  [/oʊ/g, 'オウ'],
  [/ɪə/g, 'イア'],
  [/eə/g, 'エア'],
  [/ʊə/g, 'ウア'],

  // Long vowels
  [/iː/g, 'イー'],
  [/ɑː/g, 'アー'],
  [/ɔː/g, 'オー'],
  [/uː/g, 'ウー'],
  [/ɜː/g, 'アー'],
  [/ɝ/g, 'アー'],
  [/ɚ/g, 'アー'],

  // Short vowels
  [/ɪ/g, 'イ'],
  [/i/g, 'イ'],
  [/e/g, 'エ'],
  [/ɛ/g, 'エ'],
  [/æ/g, 'ア'],
  [/ʌ/g, 'ア'],
  [/ə/g, 'ア'],
  [/ɒ/g, 'オ'],
  [/ɔ/g, 'オ'],
  [/ʊ/g, 'ウ'],
  [/u/g, 'ウ'],
  [/ɑ/g, 'ア'],
  [/a/g, 'ア'],
  [/o/g, 'オ'],
];

// Consonant + vowel combinations (for more natural katakana)
const syllableMap: [RegExp, string][] = [
  // Special combinations
  [/tʃiː/g, 'チー'],
  [/tʃi/g, 'チ'],
  [/tʃeɪ/g, 'チェイ'],
  [/tʃe/g, 'チェ'],
  [/tʃæ/g, 'チャ'],
  [/tʃa/g, 'チャ'],
  [/tʃʌ/g, 'チャ'],
  [/tʃə/g, 'チャ'],
  [/tʃɔː/g, 'チョー'],
  [/tʃɔ/g, 'チョ'],
  [/tʃuː/g, 'チュー'],
  [/tʃu/g, 'チュ'],
  [/tʃ/g, 'チ'],

  [/dʒiː/g, 'ジー'],
  [/dʒi/g, 'ジ'],
  [/dʒeɪ/g, 'ジェイ'],
  [/dʒe/g, 'ジェ'],
  [/dʒæ/g, 'ジャ'],
  [/dʒa/g, 'ジャ'],
  [/dʒʌ/g, 'ジャ'],
  [/dʒə/g, 'ジャ'],
  [/dʒɔː/g, 'ジョー'],
  [/dʒɔ/g, 'ジョ'],
  [/dʒuː/g, 'ジュー'],
  [/dʒu/g, 'ジュ'],
  [/dʒ/g, 'ジ'],

  [/ʃiː/g, 'シー'],
  [/ʃi/g, 'シ'],
  [/ʃeɪ/g, 'シェイ'],
  [/ʃe/g, 'シェ'],
  [/ʃæ/g, 'シャ'],
  [/ʃa/g, 'シャ'],
  [/ʃʌ/g, 'シャ'],
  [/ʃə/g, 'シャ'],
  [/ʃɔː/g, 'ショー'],
  [/ʃɔ/g, 'ショ'],
  [/ʃuː/g, 'シュー'],
  [/ʃu/g, 'シュ'],
  [/ʃ/g, 'シュ'],

  [/ʒiː/g, 'ジー'],
  [/ʒi/g, 'ジ'],
  [/ʒeɪ/g, 'ジェイ'],
  [/ʒe/g, 'ジェ'],
  [/ʒæ/g, 'ジャ'],
  [/ʒa/g, 'ジャ'],
  [/ʒʌ/g, 'ジャ'],
  [/ʒə/g, 'ジャ'],
  [/ʒɔː/g, 'ジョー'],
  [/ʒɔ/g, 'ジョ'],
  [/ʒuː/g, 'ジュー'],
  [/ʒu/g, 'ジュ'],
  [/ʒ/g, 'ジュ'],

  // th sounds
  [/θ/g, 'ス'],
  [/ð/g, 'ズ'],

  // ng sound
  [/ŋ/g, 'ン'],
];

// Final consonant mappings
const consonantMap: [RegExp, string][] = [
  [/p$/g, 'プ'],
  [/b$/g, 'ブ'],
  [/t$/g, 'ト'],
  [/d$/g, 'ド'],
  [/k$/g, 'ク'],
  [/ɡ$/g, 'グ'],
  [/g$/g, 'グ'],
  [/f$/g, 'フ'],
  [/v$/g, 'ヴ'],
  [/s$/g, 'ス'],
  [/z$/g, 'ズ'],
  [/m$/g, 'ム'],
  [/n$/g, 'ン'],
  [/l$/g, 'ル'],
  [/r$/g, 'ル'],
  [/ɹ$/g, 'ル'],

  // Consonants before vowels
  [/p(?=[aeiouɪɛæʌəɔʊɑ])/g, 'パ'],
  [/b(?=[aeiouɪɛæʌəɔʊɑ])/g, 'バ'],
  [/t(?=[aeiouɪɛæʌəɔʊɑ])/g, 'タ'],
  [/d(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ダ'],
  [/k(?=[aeiouɪɛæʌəɔʊɑ])/g, 'カ'],
  [/ɡ(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ガ'],
  [/g(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ガ'],
  [/f(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ファ'],
  [/v(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ヴァ'],
  [/s(?=[aeiouɪɛæʌəɔʊɑ])/g, 'サ'],
  [/z(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ザ'],
  [/h(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ハ'],
  [/m(?=[aeiouɪɛæʌəɔʊɑ])/g, 'マ'],
  [/n(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ナ'],
  [/l(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ラ'],
  [/r(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ラ'],
  [/ɹ(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ラ'],
  [/w(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ワ'],
  [/j(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ヤ'],
  [/y(?=[aeiouɪɛæʌəɔʊɑ])/g, 'ヤ'],
];

/**
 * Convert IPA pronunciation to Katakana
 */
export function ipaToKatakana(ipa: string): string {
  if (!ipa) return '';

  // Remove slashes and stress markers
  let result = ipa
    .replace(/[/[\]]/g, '')
    .replace(/[ˈˌ']/g, '')
    .trim();

  // Apply syllable mappings first (special combinations)
  for (const [pattern, replacement] of syllableMap) {
    result = result.replace(pattern, replacement);
  }

  // Apply consonant mappings
  for (const [pattern, replacement] of consonantMap) {
    result = result.replace(pattern, replacement);
  }

  // Apply vowel mappings
  for (const [pattern, replacement] of vowelMap) {
    result = result.replace(pattern, replacement);
  }

  // Clean up any remaining IPA characters
  result = result.replace(/[a-zɪɛæʌəɔʊɑɹ]/gi, '');

  return result;
}

/**
 * Check if user's browser language is Japanese
 */
export function isJapaneseUser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.language.startsWith('ja');
}

/**
 * Get Katakana pronunciation
 */
export function getKatakanaPronunciation(ipa: string | undefined): string {
  return ipaToKatakana(ipa || '');
}
