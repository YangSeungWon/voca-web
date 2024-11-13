import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  const { wordId, userKey } = await req.json();

  if (!wordId || !userKey) {
    return NextResponse.json({ error: 'wordId and userKey are required.' }, { status: 400 });
  }

  // Find the word and verify ownership
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: { user: true },
  });

  if (!word || word.user.key !== userKey) {
    return NextResponse.json({ error: 'Word not found or unauthorized.' }, { status: 404 });
  }

  // Soft delete the word
  await prisma.word.update({
    where: { id: wordId },
    data: { isDeleted: true },
  });

  return NextResponse.json({ message: 'Word soft deleted.' }, { status: 200 });
}