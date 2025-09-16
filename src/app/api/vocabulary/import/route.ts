import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromDictionaryAPI } from '@/lib/dictionary-api';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { words } = await req.json();
    
    if (!words || !Array.isArray(words)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results = {
      imported: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as string[]
    };

    for (const wordData of words) {
      try {
        // Check if word already exists for this user
        const existing = await prisma.vocabulary.findFirst({
          where: {
            userId,
            word: {
              word: wordData.word
            }
          }
        });

        if (existing) {
          results.duplicates++;
          continue;
        }

        // Try to fetch from dictionary API if no definition provided
        let wordEntry;
        if (!wordData.definition) {
          const apiResult = await fetchFromDictionaryAPI(wordData.word);
          if (apiResult) {
            wordEntry = apiResult;
          } else {
            results.errors.push(`Could not find definition for: ${wordData.word}`);
            results.failed++;
            continue;
          }
        } else {
          // Use provided data
          wordEntry = {
            word: wordData.word,
            pronunciation: wordData.pronunciation || null,
            definitions: [{
              partOfSpeech: wordData.partOfSpeech,
              meaning: wordData.definition,
              examples: []
            }]
          };
        }

        // Check if word exists in database
        let word = await prisma.word.findUnique({
          where: { word: wordEntry.word }
        });

        if (!word) {
          word = await prisma.word.create({
            data: {
              word: wordEntry.word,
              pronunciation: wordEntry.pronunciation,
              definitions: {
                create: wordEntry.definitions.map(def => ({
                  partOfSpeech: def.partOfSpeech,
                  meaning: def.meaning
                }))
              }
            }
          });
        }

        // Add to user's vocabulary
        await prisma.vocabulary.create({
          data: {
            userId,
            wordId: word.id,
            level: wordData.level || 0,
            notes: wordData.notes
          }
        });

        results.imported++;
      } catch (error) {
        console.error(`Failed to import word ${wordData.word}:`, error);
        results.errors.push(`Failed to import: ${wordData.word}`);
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import words' },
      { status: 500 }
    );
  }
}