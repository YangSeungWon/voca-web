import { DictionaryEntry } from './dictionary';

interface APIPhonetic {
  text?: string;
}

interface APIDefinition {
  definition: string;
  example?: string;
}

interface APIMeaning {
  partOfSpeech: string;
  definitions: APIDefinition[];
}

interface APIDictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: APIPhonetic[];
  meanings: APIMeaning[];
}

export async function fetchFromDictionaryAPI(word: string): Promise<DictionaryEntry | null> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    const entry = data[0];
    
    // Transform API response to our format
    const definitions = (entry as APIDictionaryEntry).meanings.flatMap((meaning) => 
      meaning.definitions.map((def) => ({
        partOfSpeech: meaning.partOfSpeech,
        meaning: def.definition,
        examples: def.example ? [def.example] : []
      }))
    );

    // Get pronunciation
    const pronunciation = (entry as APIDictionaryEntry).phonetic || 
      (entry as APIDictionaryEntry).phonetics?.find((p) => p.text)?.text || 
      null;

    return {
      word: entry.word,
      pronunciation,
      definitions
    };
  } catch (error) {
    console.error('Dictionary API error:', error);
    return null;
  }
}