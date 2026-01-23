import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/jwt';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = payload.userId;

    const vocabulary = await prisma.vocabulary.findFirst({
      where: {
        id: id,
        userId
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = payload.userId;

    const body = await req.json();

    // Validate level field (must be 0-5 integer)
    if (body.level !== undefined) {
      const level = Number(body.level);
      if (!Number.isInteger(level) || level < 0 || level > 5) {
        return NextResponse.json(
          { error: 'Level must be an integer between 0 and 5' },
          { status: 400 }
        );
      }
      body.level = level;
    }

    // Validate notes length
    if (body.notes !== undefined && typeof body.notes === 'string' && body.notes.length > 1000) {
      return NextResponse.json(
        { error: 'Notes must be 1000 characters or less' },
        { status: 400 }
      );
    }

    const vocabulary = await prisma.vocabulary.findFirst({
      where: {
        id: id,
        userId
      }
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: 'Word not found in vocabulary' },
        { status: 404 }
      );
    }

    // Update the vocabulary item with study progress
    const updated = await prisma.vocabulary.update({
      where: { id },
      data: {
        level: body.level !== undefined ? body.level : vocabulary.level,
        reviewCount: body.reviewCount !== undefined ? body.reviewCount : vocabulary.reviewCount,
        correctCount: body.correctCount !== undefined ? body.correctCount : vocabulary.correctCount,
        lastReviewed: new Date(),
        nextReview: calculateNextReview(body.level || vocabulary.level),
        notes: body.notes !== undefined ? body.notes : vocabulary.notes
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update vocabulary item:', error);
    return NextResponse.json(
      { error: 'Failed to update vocabulary item' },
      { status: 500 }
    );
  }
}

// Simple spaced repetition algorithm
function calculateNextReview(level: number): Date {
  const intervals = [1, 3, 7, 14, 30, 90]; // Days
  const daysToAdd = intervals[Math.min(level, intervals.length - 1)];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
}