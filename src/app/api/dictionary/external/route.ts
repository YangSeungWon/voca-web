import { NextRequest, NextResponse } from 'next/server';
import { DictionaryEntry } from '@/lib/dictionary';

const extendedDictionary: Record<string, DictionaryEntry> = {
  'hello': {
    word: 'hello',
    pronunciation: '/həˈləʊ/',
    definitions: [
      {
        partOfSpeech: 'interjection',
        meaning: 'used as a greeting or to begin a phone conversation',
        examples: ['Hello, how are you?', 'Hello, this is John speaking.']
      },
      {
        partOfSpeech: 'noun',
        meaning: 'an utterance of "hello"; a greeting',
        examples: ['She gave him a warm hello.']
      }
    ]
  },
  'world': {
    word: 'world',
    pronunciation: '/wɜːld/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'the earth and all its inhabitants',
        examples: ['The world is getting smaller.']
      },
      {
        partOfSpeech: 'noun',
        meaning: 'a particular area of human activity',
        examples: ['The world of finance.']
      }
    ]
  },
  'love': {
    word: 'love',
    pronunciation: '/lʌv/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'an intense feeling of deep affection',
        examples: ['Their love for each other was obvious.']
      },
      {
        partOfSpeech: 'verb',
        meaning: 'to feel deep affection for someone',
        examples: ['I love you.']
      }
    ]
  },
  'study': {
    word: 'study',
    pronunciation: '/ˈstʌdi/',
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: 'to devote time and attention to gaining knowledge',
        examples: ['She studied hard for the exam.']
      },
      {
        partOfSpeech: 'noun',
        meaning: 'the act of learning or gaining knowledge',
        examples: ['The study of languages is fascinating.']
      }
    ]
  },
  'computer': {
    word: 'computer',
    pronunciation: '/kəmˈpjuːtər/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'an electronic device for processing and storing data',
        examples: ['She works on her computer all day.']
      }
    ]
  },
  'program': {
    word: 'program',
    pronunciation: '/ˈprəʊɡræm/',
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'a set of instructions for a computer',
        examples: ['He wrote a program to analyze the data.']
      },
      {
        partOfSpeech: 'verb',
        meaning: 'to write computer programs',
        examples: ['She learned to program in Python.']
      }
    ]
  }
};

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
  const entry = extendedDictionary[normalizedWord];

  if (entry) {
    return NextResponse.json(entry);
  }

  return NextResponse.json({
    word: normalizedWord,
    definitions: [
      {
        partOfSpeech: 'unknown',
        meaning: `Definition for "${word}" is not available yet.`,
        examples: []
      }
    ]
  });
}