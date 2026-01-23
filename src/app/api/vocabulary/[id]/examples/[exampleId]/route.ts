import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/jwt';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exampleId: string }> }
) {
  try {
    const { exampleId } = await params;

    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { sentence, translation } = await req.json();

    if (!sentence) {
      return NextResponse.json({ error: 'Sentence is required' }, { status: 400 });
    }

    const updated = await prisma.example.update({
      where: { id: exampleId },
      data: {
        sentence,
        translation
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Example update error:', error);
    return NextResponse.json(
      { error: 'Failed to update example' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; exampleId: string }> }
) {
  try {
    const { exampleId } = await params;

    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await prisma.example.delete({
      where: { id: exampleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Example deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete example' },
      { status: 500 }
    );
  }
}