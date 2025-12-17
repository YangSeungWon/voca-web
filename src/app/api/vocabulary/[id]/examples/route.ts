import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vocabularyId } = await params;

    // JWT authentication required
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the vocabulary item to get the wordId
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      select: { wordId: true }
    });

    if (!vocabulary) {
      return NextResponse.json({ error: 'Vocabulary not found' }, { status: 404 });
    }

    // Get examples for this word
    const examples = await prisma.example.findMany({
      where: { wordId: vocabulary.wordId },
      orderBy: { id: 'asc' }
    });

    return NextResponse.json(examples);
  } catch (error) {
    console.error('Examples fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vocabularyId } = await params;

    // JWT authentication required
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { sentence, translation } = await req.json();

    if (!sentence) {
      return NextResponse.json({ error: 'Sentence is required' }, { status: 400 });
    }

    // Get the vocabulary item to get the wordId
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      select: { wordId: true }
    });

    if (!vocabulary) {
      return NextResponse.json({ error: 'Vocabulary not found' }, { status: 404 });
    }

    const example = await prisma.example.create({
      data: {
        wordId: vocabulary.wordId,
        sentence,
        translation
      }
    });

    return NextResponse.json(example);
  } catch (error) {
    console.error('Example creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create example' },
      { status: 500 }
    );
  }
}