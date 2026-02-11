/**
 * ARPAbet to Katakana conversion
 * Converts CMU Pronouncing Dictionary phonemes to Japanese Katakana
 * Example: "HH AH0 L OW1" -> "ハロー"
 */

// ARPAbet vowels to Katakana
const VOWEL_MAP: Record<string, string> = {
  'AA': 'ア',   // odd, father → ア
  'AE': 'ア',   // at, cat (æ sound) → ア
  'AH': 'ア',   // hut, but → ア
  'AO': 'オ',   // ought, all → オー (long O)
  'AW': 'アウ', // cow, how → アウ
  'AY': 'アイ', // hide, my → アイ
  'EH': 'エ',   // ed, red → エ
  'ER': 'アー', // hurt, bird → アー
  'EY': 'エイ', // ate, say → エイ
  'IH': 'イ',   // it, big → イ
  'IY': 'イー', // eat, see → イー
  'OW': 'オー', // oat, go → オー
  'OY': 'オイ', // toy, boy → オイ
  'UH': 'ウ',   // hood, book → ウ
  'UW': 'ウー', // two, you → ウー
};

// Special consonant + Y + vowel patterns (for sounds like ビュー, ミュー)
const CYV_MAP: Record<string, Record<string, string>> = {
  'B': { 'UW': 'ビュー', 'UH': 'ビュ', 'AA': 'ビャ', 'AH': 'ビャ', 'OW': 'ビョー' },
  'F': { 'UW': 'フュー', 'UH': 'フュ' },
  'K': { 'UW': 'キュー', 'UH': 'キュ' },
  'M': { 'UW': 'ミュー', 'UH': 'ミュ', 'AA': 'ミャ', 'AH': 'ミャ' },
  'N': { 'UW': 'ニュー', 'UH': 'ニュ' },
  'P': { 'UW': 'ピュー', 'UH': 'ピュ' },
  'V': { 'UW': 'ヴュー', 'UH': 'ヴュ' },
};

// Consonant + vowel combinations for Japanese syllables
// Format: consonant -> { vowel -> katakana }
const SYLLABLE_MAP: Record<string, Record<string, string>> = {
  'B': { 'A': 'バ', 'I': 'ビ', 'U': 'ブ', 'E': 'ベ', 'O': 'ボ' },
  'CH': { 'A': 'チャ', 'I': 'チ', 'U': 'チュ', 'E': 'チェ', 'O': 'チョ' },
  'D': { 'A': 'ダ', 'I': 'ディ', 'U': 'ドゥ', 'E': 'デ', 'O': 'ド' },
  'DH': { 'A': 'ザ', 'I': 'ジ', 'U': 'ズ', 'E': 'ゼ', 'O': 'ゾ' }, // voiced th
  'F': { 'A': 'ファ', 'I': 'フィ', 'U': 'フ', 'E': 'フェ', 'O': 'フォ' },
  'G': { 'A': 'ガ', 'I': 'ギ', 'U': 'グ', 'E': 'ゲ', 'O': 'ゴ' },
  'HH': { 'A': 'ハ', 'I': 'ヒ', 'U': 'フ', 'E': 'ヘ', 'O': 'ホ' },
  'JH': { 'A': 'ジャ', 'I': 'ジ', 'U': 'ジュ', 'E': 'ジェ', 'O': 'ジョ' },
  'K': { 'A': 'カ', 'I': 'キ', 'U': 'ク', 'E': 'ケ', 'O': 'コ' },
  'L': { 'A': 'ラ', 'I': 'リ', 'U': 'ル', 'E': 'レ', 'O': 'ロ' },
  'M': { 'A': 'マ', 'I': 'ミ', 'U': 'ム', 'E': 'メ', 'O': 'モ' },
  'N': { 'A': 'ナ', 'I': 'ニ', 'U': 'ニュ', 'E': 'ネ', 'O': 'ノ' },
  'P': { 'A': 'パ', 'I': 'ピ', 'U': 'プ', 'E': 'ペ', 'O': 'ポ' },
  'R': { 'A': 'ラ', 'I': 'リ', 'U': 'ル', 'E': 'レ', 'O': 'ロ' },
  'S': { 'A': 'サ', 'I': 'シ', 'U': 'ス', 'E': 'セ', 'O': 'ソ' },
  'SH': { 'A': 'シャ', 'I': 'シ', 'U': 'シュ', 'E': 'シェ', 'O': 'ショ' },
  'T': { 'A': 'タ', 'I': 'ティ', 'U': 'トゥ', 'E': 'テ', 'O': 'ト' },
  'TH': { 'A': 'サ', 'I': 'シ', 'U': 'ス', 'E': 'セ', 'O': 'ソ' }, // voiceless th
  'V': { 'A': 'ヴァ', 'I': 'ヴィ', 'U': 'ヴ', 'E': 'ヴェ', 'O': 'ヴォ' },
  'W': { 'A': 'ワ', 'I': 'ウィ', 'U': 'ウ', 'E': 'ウェ', 'O': 'ウォ' },
  'Y': { 'A': 'ヤ', 'I': 'イ', 'U': 'ユ', 'E': 'イェ', 'O': 'ヨ' },
  'Z': { 'A': 'ザ', 'I': 'ジ', 'U': 'ズ', 'E': 'ゼ', 'O': 'ゾ' },
  'ZH': { 'A': 'ジャ', 'I': 'ジ', 'U': 'ジュ', 'E': 'ジェ', 'O': 'ジョ' },
};

// Final consonants (at word end or before another consonant)
const FINAL_CONSONANT: Record<string, string> = {
  'B': 'ブ',
  'CH': 'チ',
  'D': 'ド',
  'DH': 'ズ',
  'F': 'フ',
  'G': 'グ',
  'HH': '',
  'JH': 'ジ',
  'K': 'ク',
  'L': 'ル',
  'M': 'ム',
  'N': 'ン',
  'NG': 'ング',
  'P': 'プ',
  'R': 'ル',
  'S': 'ス',
  'SH': 'シュ',
  'T': 'ト',
  'TH': 'ス',
  'V': 'ヴ',
  'W': 'ウ',
  'Y': 'イ',
  'Z': 'ズ',
  'ZH': 'ジュ',
};

// Map vowel phonemes to simple vowel category for syllable lookup
function getVowelCategory(vowel: string): string {
  if (vowel.startsWith('AA') || vowel.startsWith('AE') || vowel.startsWith('AH') || vowel.startsWith('AW') || vowel.startsWith('AY')) return 'A';
  if (vowel.startsWith('IH') || vowel.startsWith('IY')) return 'I';
  if (vowel.startsWith('UH') || vowel.startsWith('UW')) return 'U';
  if (vowel.startsWith('EH') || vowel.startsWith('EY') || vowel.startsWith('ER')) return 'E';
  if (vowel.startsWith('AO') || vowel.startsWith('OW') || vowel.startsWith('OY')) return 'O';
  return 'A';
}

// Check if phoneme is a vowel
function isVowel(phoneme: string): boolean {
  const base = phoneme.replace(/[012]$/, '');
  return base in VOWEL_MAP;
}

// Check if phoneme is a consonant
function isConsonant(phoneme: string): boolean {
  return phoneme in SYLLABLE_MAP || phoneme in FINAL_CONSONANT;
}

/**
 * Convert ARPAbet string to Katakana
 * @param arpabet - ARPAbet pronunciation string (e.g., "HH AH0 L OW1")
 * @returns Katakana string (e.g., "ハロー")
 */
export function arpabetToKatakana(arpabet: string): string {
  const phonemes = arpabet.split(' ');
  let result = '';
  let i = 0;

  while (i < phonemes.length) {
    const phoneme = phonemes[i];
    const basePhoneme = phoneme.replace(/[012]$/, '');
    const nextPhoneme = i + 1 < phonemes.length ? phonemes[i + 1] : null;
    const nextBase = nextPhoneme?.replace(/[012]$/, '');
    const thirdPhoneme = i + 2 < phonemes.length ? phonemes[i + 2] : null;
    const thirdBase = thirdPhoneme?.replace(/[012]$/, '');

    if (isVowel(phoneme)) {
      // Standalone vowel
      const vowelKana = VOWEL_MAP[basePhoneme] || '';
      result += vowelKana;
      // Add long vowel marker for AO
      if (basePhoneme === 'AO') {
        result += 'ー';
      }
      i++;
    } else if (isConsonant(basePhoneme)) {
      // Check for Consonant + Y + Vowel pattern (e.g., B Y UW -> ビュー)
      if (nextBase === 'Y' && thirdPhoneme && isVowel(thirdPhoneme)) {
        const cyvMap = CYV_MAP[basePhoneme];
        if (cyvMap && cyvMap[thirdBase || '']) {
          result += cyvMap[thirdBase || ''];
          i += 3; // Skip consonant, Y, and vowel
          continue;
        }
      }

      // Check if next phoneme is a vowel to form syllable
      if (nextPhoneme && isVowel(nextPhoneme)) {
        const vowelCategory = getVowelCategory(nextBase || '');
        const syllableMap = SYLLABLE_MAP[basePhoneme];

        if (syllableMap && syllableMap[vowelCategory]) {
          result += syllableMap[vowelCategory];

          // Handle long vowels and diphthongs
          if (nextBase === 'IY' || nextBase === 'UW' || nextBase === 'ER') {
            result += 'ー';
          } else if (nextBase === 'OW' || nextBase === 'AO') {
            result += 'ー';
          } else if (nextBase === 'EY') {
            result += 'イ';
          } else if (nextBase === 'AY') {
            result += 'イ';
          } else if (nextBase === 'AW') {
            result += 'ウ';
          } else if (nextBase === 'OY') {
            result += 'イ';
          }

          i += 2; // Skip both consonant and vowel
        } else {
          // Fallback: use final consonant form + vowel
          result += (FINAL_CONSONANT[basePhoneme] || '') + (VOWEL_MAP[nextBase || ''] || '');
          i += 2;
        }
      } else {
        // Consonant without following vowel (final or consonant cluster)
        if (basePhoneme === 'NG') {
          result += 'ン';
        } else {
          result += FINAL_CONSONANT[basePhoneme] || '';
        }
        i++;
      }
    } else {
      // Unknown phoneme, skip
      i++;
    }
  }

  return result;
}

/**
 * Get Katakana pronunciation from CMU dictionary
 * @param word - English word
 * @returns Katakana pronunciation or null if not found
 */
export async function getKatakanaFromCmu(word: string): Promise<string | null> {
  try {
    const { dictionary } = await import('cmu-pronouncing-dictionary');
    const arpabet = dictionary[word.toLowerCase()];

    if (!arpabet) {
      return null;
    }

    return arpabetToKatakana(arpabet);
  } catch (error) {
    console.error('CMU dictionary lookup failed:', error);
    return null;
  }
}
