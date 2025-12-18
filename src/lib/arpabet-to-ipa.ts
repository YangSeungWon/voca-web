/**
 * ARPAbet to IPA conversion
 * Based on CMU Pronouncing Dictionary phoneme set
 */

// ARPAbet to IPA mapping
const ARPABET_TO_IPA: Record<string, string> = {
  // Vowels
  'AA': 'ɑ',   // odd, father
  'AE': 'æ',   // at, cat
  'AH': 'ʌ',   // hut, but (stressed)
  'AO': 'ɔ',   // ought, all
  'AW': 'aʊ',  // cow, how
  'AY': 'aɪ',  // hide, my
  'EH': 'ɛ',   // ed, red
  'ER': 'ɜr',  // hurt, bird
  'EY': 'eɪ',  // ate, say
  'IH': 'ɪ',   // it, big
  'IY': 'i',   // eat, see
  'OW': 'oʊ',  // oat, go
  'OY': 'ɔɪ',  // toy, boy
  'UH': 'ʊ',   // hood, book
  'UW': 'u',   // two, you

  // Consonants
  'B': 'b',
  'CH': 'tʃ',
  'D': 'd',
  'DH': 'ð',   // the, this
  'F': 'f',
  'G': 'ɡ',
  'HH': 'h',
  'JH': 'dʒ',  // judge
  'K': 'k',
  'L': 'l',
  'M': 'm',
  'N': 'n',
  'NG': 'ŋ',   // sing
  'P': 'p',
  'R': 'r',
  'S': 's',
  'SH': 'ʃ',   // she
  'T': 't',
  'TH': 'θ',   // think
  'V': 'v',
  'W': 'w',
  'Y': 'j',
  'Z': 'z',
  'ZH': 'ʒ',   // measure
};

// Stress markers
const STRESS_PRIMARY = 'ˈ';
const STRESS_SECONDARY = 'ˌ';

/**
 * Convert ARPAbet string to IPA
 * @param arpabet - ARPAbet pronunciation string (e.g., "HH AH0 L OW1")
 * @returns IPA pronunciation string (e.g., "həˈloʊ")
 */
export function arpabetToIpa(arpabet: string): string {
  const phonemes = arpabet.split(' ');
  let result = '';
  let pendingStress = '';

  for (const phoneme of phonemes) {
    // Extract stress number (0, 1, or 2) from vowels
    const stressMatch = phoneme.match(/^([A-Z]+)([012])$/);

    let basePhoneme: string;
    let stress = '';

    if (stressMatch) {
      basePhoneme = stressMatch[1];
      const stressLevel = stressMatch[2];

      if (stressLevel === '1') {
        stress = STRESS_PRIMARY;
      } else if (stressLevel === '2') {
        stress = STRESS_SECONDARY;
      }
      // 0 = no stress, add nothing
    } else {
      basePhoneme = phoneme;
    }

    const ipa = ARPABET_TO_IPA[basePhoneme];

    if (ipa) {
      // Handle unstressed AH as schwa
      if (basePhoneme === 'AH' && !stress) {
        result += pendingStress + 'ə';
      } else {
        result += pendingStress + stress + ipa;
      }
      pendingStress = '';
    }
  }

  return result;
}

/**
 * Get IPA pronunciation from CMU dictionary
 * @param word - English word
 * @returns IPA pronunciation or null if not found
 */
export async function getIpaFromCmu(word: string): Promise<string | null> {
  try {
    const { dictionary } = await import('cmu-pronouncing-dictionary');
    const arpabet = dictionary[word.toLowerCase()];

    if (!arpabet) {
      return null;
    }

    return arpabetToIpa(arpabet);
  } catch (error) {
    console.error('CMU dictionary lookup failed:', error);
    return null;
  }
}
