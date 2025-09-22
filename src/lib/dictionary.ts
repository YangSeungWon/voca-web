export interface DictionaryEntry {
  word: string;
  pronunciation?: string;
  definitions: {
    partOfSpeech: string;
    meaning: string;
    examples?: string[];
  }[];
}

const commonWords: DictionaryEntry[] = [
  {
    word: "abandon",
    pronunciation: "/əˈbændən/",
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "to leave someone or something completely",
        examples: ["They had to abandon the car and walk."]
      },
      {
        partOfSpeech: "noun",
        meaning: "complete lack of inhibition or restraint",
        examples: ["He danced with wild abandon."]
      }
    ]
  },
  {
    word: "ability",
    pronunciation: "/əˈbɪləti/",
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "the power or skill to do something",
        examples: ["She has the ability to speak six languages."]
      }
    ]
  },
  {
    word: "accept",
    pronunciation: "/əkˈsept/",
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "to agree to take something that is offered",
        examples: ["She accepted the job offer immediately."]
      }
    ]
  },
  {
    word: "achieve",
    pronunciation: "/əˈtʃiːv/",
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "to succeed in doing something good",
        examples: ["He achieved his goal of running a marathon."]
      }
    ]
  },
  {
    word: "acquire",
    pronunciation: "/əˈkwaɪər/",
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "to get or gain something",
        examples: ["The company acquired a new subsidiary."]
      }
    ]
  }
];

const fallbackDefinition = (word: string): DictionaryEntry => ({
  word,
  definitions: [
    {
      partOfSpeech: "unknown",
      meaning: `Definition for "${word}" is not available in the local dictionary.`,
      examples: []
    }
  ]
});

export async function searchWord(word: string): Promise<DictionaryEntry | null> {
  const normalizedWord = word.toLowerCase().trim();

  const found = commonWords.find(entry =>
    entry.word.toLowerCase() === normalizedWord
  );

  if (found) {
    return found;
  }

  // Try direct API call (works on both web and mobile)
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
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
          undefined;

        return {
          word: entry.word,
          pronunciation,
          definitions
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch from dictionary API:', error);
  }

  return fallbackDefinition(word);
}

export function getRandomWords(count: number = 10): DictionaryEntry[] {
  const shuffled = [...commonWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}