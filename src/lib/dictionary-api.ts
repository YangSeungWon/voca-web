import { DictionaryEntry } from './dictionary';

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
    const definitions = entry.meanings.flatMap((meaning: any) => 
      meaning.definitions.map((def: any) => ({
        partOfSpeech: meaning.partOfSpeech,
        meaning: def.definition,
        examples: def.example ? [def.example] : []
      }))
    );

    // Get pronunciation
    const pronunciation = entry.phonetic || 
      entry.phonetics?.find((p: any) => p.text)?.text || 
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