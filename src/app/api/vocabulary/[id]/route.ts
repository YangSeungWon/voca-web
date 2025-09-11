import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = req.headers.get('x-user-id') || 'default-user';
    
    const user = await prisma.user.findUnique({
      where: { username: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const vocabulary = await prisma.vocabulary.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: 'Word not found in vocabulary' },
        { status: 404 }
      );
    }

    await prisma.vocabulary.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Word removed from vocabulary' });
  } catch (error) {
    console.error('Failed to delete word:', error);
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}