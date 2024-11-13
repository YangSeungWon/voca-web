import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetches the definition of a word from Cambridge Dictionary.
 * @param word The English word to fetch.
 * @returns The definition string or null if not found.
 */
const fetchDefinition = async (word: string): Promise<string | null> => {
  try {
    const response = await axios.get(`https://dictionary.cambridge.org/dictionary/english/${word}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });
    const html = response.data;
    const $ = cheerio.load(html);
    const definition = $('.def.ddef_d.db').first().text().trim();
    return definition || null;
  } catch (error) {
    console.error('Error fetching definition:', error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  const { word, userKey } = await req.json();

  if (!word || !userKey) {
    return NextResponse.json({ error: 'Word and userKey are required.' }, { status: 400 });
  }

  // Find or create the user
  let user = await prisma.user.findUnique({ where: { key: userKey } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        key: userKey,
      },
    });
  }

  // Check if the word already exists for the user
  const existingWord = await prisma.word.findFirst({
    where: {
      content: word,
      userId: user.id,
      isDeleted: false,
    },
  });

  if (existingWord) {
    return NextResponse.json({ error: 'Word already exists in your vocabulary list.' }, { status: 409 });
  }

  // Fetch the definition
  const definition = await fetchDefinition(word);
  if (!definition) {
    return NextResponse.json({ error: 'Definition not found.' }, { status: 404 });
  }

  // Save the word
  const savedWord = await prisma.word.create({
    data: {
      content: word,
      definition,
      user: { connect: { id: user.id } },
    },
  });

  return NextResponse.json(savedWord, { status: 201 });
}