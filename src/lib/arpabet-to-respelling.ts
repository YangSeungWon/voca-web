/**
 * ARPAbet to English Respelling conversion
 * Converts CMU Pronouncing Dictionary phonemes to readable English pronunciation
 * Example: "HH AH0 L OW1" -> "huh-LOH"
 */

// ARPAbet to Respelling mapping
const ARPABET_TO_RESPELLING: Record<string, string> = {
  // Vowels (lowercase = unstressed, UPPERCASE = stressed)
  'AA': 'ah',   // odd, father
  'AE': 'a',    // at, cat
  'AH': 'uh',   // hut, but
  'AO': 'aw',   // ought, all
  'AW': 'ow',   // cow, how
  'AY': 'eye',  // hide, my
  'EH': 'eh',   // ed, red
  'ER': 'ur',   // hurt, bird
  'EY': 'ay',   // ate, say
  'IH': 'ih',   // it, big
  'IY': 'ee',   // eat, see
  'OW': 'oh',   // oat, go
  'OY': 'oy',   // toy, boy
  'UH': 'oo',   // hood, book
  'UW': 'oo',   // two, you

  // Consonants
  'B': 'b',
  'CH': 'ch',
  'D': 'd',
  'DH': 'th',   // the, this (voiced)
  'F': 'f',
  'G': 'g',
  'HH': 'h',
  'JH': 'j',    // judge
  'K': 'k',
  'L': 'l',
  'M': 'm',
  'N': 'n',
  'NG': 'ng',   // sing
  'P': 'p',
  'R': 'r',
  'S': 's',
  'SH': 'sh',   // she
  'T': 't',
  'TH': 'th',   // think (voiceless)
  'V': 'v',
  'W': 'w',
  'Y': 'y',
  'Z': 'z',
  'ZH': 'zh',   // measure
};

// Vowels that form syllables
const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);

/**
 * Convert ARPAbet string to English respelling
 * @param arpabet - ARPAbet pronunciation string (e.g., "HH AH0 L OW1")
 * @returns Respelling string (e.g., "huh-LOH")
 */
export function arpabetToRespelling(arpabet: string): string {
  const phonemes = arpabet.split(' ');
  const syllables: string[] = [];
  let currentSyllable = '';
  let currentStress = 0;

  for (const phoneme of phonemes) {
    // Extract stress number (0, 1, or 2) from vowels
    const stressMatch = phoneme.match(/^([A-Z]+)([012])$/);

    let basePhoneme: string;
    let stress = 0;

    if (stressMatch) {
      basePhoneme = stressMatch[1];
      stress = parseInt(stressMatch[2]);
    } else {
      basePhoneme = phoneme;
    }

    const respelling = ARPABET_TO_RESPELLING[basePhoneme];
    if (!respelling) continue;

    // Check if this is a vowel (syllable nucleus)
    if (VOWELS.has(basePhoneme)) {
      // If we have accumulated consonants, add them to current syllable
      currentSyllable += respelling;
      currentStress = stress;

      // Look ahead for trailing consonants in this syllable
      // For simplicity, we'll close syllables at the next vowel
    } else {
      // Consonant
      if (currentSyllable && syllables.length === 0 && !VOWELS.has(basePhoneme)) {
        // This consonant might belong to the next syllable
        // Simple heuristic: if we have a complete syllable, start new one
        const hasVowel = [...currentSyllable].some(c => 'aeiou'.includes(c.toLowerCase()));
        if (hasVowel) {
          // Push current syllable and start new one
          syllables.push(currentStress >= 1 ? currentSyllable.toUpperCase() : currentSyllable);
          currentSyllable = respelling;
          currentStress = 0;
        } else {
          currentSyllable += respelling;
        }
      } else {
        currentSyllable += respelling;
      }
    }
  }

  // Push the last syllable
  if (currentSyllable) {
    syllables.push(currentStress >= 1 ? currentSyllable.toUpperCase() : currentSyllable);
  }

  // If only one syllable, just return it
  if (syllables.length <= 1) {
    return syllables[0] || '';
  }

  return syllables.join('-');
}

/**
 * Better syllable-aware conversion
 * @param arpabet - ARPAbet pronunciation string
 * @returns Respelling with proper syllable breaks
 */
export function arpabetToRespellingV2(arpabet: string): string {
  const phonemes = arpabet.split(' ');
  const parts: Array<{ text: string; stressed: boolean }> = [];

  let currentPart = '';
  let isStressed = false;
  let sawVowel = false;

  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i];
    const stressMatch = phoneme.match(/^([A-Z]+)([012])$/);

    let basePhoneme: string;
    let stress = 0;

    if (stressMatch) {
      basePhoneme = stressMatch[1];
      stress = parseInt(stressMatch[2]);
    } else {
      basePhoneme = phoneme;
    }

    const respelling = ARPABET_TO_RESPELLING[basePhoneme];
    if (!respelling) continue;

    const isVowel = VOWELS.has(basePhoneme);

    if (isVowel) {
      if (sawVowel) {
        // New syllable - save current and start new
        parts.push({ text: currentPart, stressed: isStressed });
        currentPart = respelling;
        isStressed = stress >= 1;
      } else {
        currentPart += respelling;
        isStressed = stress >= 1;
      }
      sawVowel = true;
    } else {
      // Consonant
      if (sawVowel && i < phonemes.length - 1) {
        // Check if next phoneme is a vowel
        const nextPhoneme = phonemes[i + 1];
        const nextMatch = nextPhoneme.match(/^([A-Z]+)([012])?$/);
        const nextBase = nextMatch ? nextMatch[1] : nextPhoneme;

        if (VOWELS.has(nextBase)) {
          // This consonant starts the next syllable
          parts.push({ text: currentPart, stressed: isStressed });
          currentPart = respelling;
          isStressed = false;
          sawVowel = false;
        } else {
          currentPart += respelling;
        }
      } else {
        currentPart += respelling;
      }
    }
  }

  // Push the last part
  if (currentPart) {
    parts.push({ text: currentPart, stressed: isStressed });
  }

  // Format output
  const formatted = parts.map(p => p.stressed ? p.text.toUpperCase() : p.text);

  return formatted.join('-');
}

/**
 * Get respelling pronunciation from CMU dictionary
 * @param word - English word
 * @returns Respelling pronunciation or null if not found
 */
export async function getRespellingFromCmu(word: string): Promise<string | null> {
  try {
    const { dictionary } = await import('cmu-pronouncing-dictionary');
    const arpabet = dictionary[word.toLowerCase()];

    if (!arpabet) {
      return null;
    }

    return arpabetToRespellingV2(arpabet);
  } catch (error) {
    console.error('CMU dictionary lookup failed:', error);
    return null;
  }
}
