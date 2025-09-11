import { NextRequest, NextResponse } from 'next/server';
import { fetchFromDictionaryAPI } from '@/lib/dictionary-api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  const normalizedWord = word.toLowerCase().trim();
  
  // Try to fetch from real dictionary API
  const entry = await fetchFromDictionaryAPI(normalizedWord);
  
  if (entry) {
    return NextResponse.json(entry);
  }

  // Fallback response if API fails
  return NextResponse.json({
    word: normalizedWord,
    definitions: [
      {
        partOfSpeech: 'unknown',
        meaning: `Unable to fetch definition for "${word}". Please check your spelling or try again later.`,
        examples: []
      }
    ]
  });
}