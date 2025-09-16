import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: { userId },
      include: {
        _count: {
          select: { vocabulary: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Groups fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { name, description, color, icon } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        userId,
        name,
        description,
        color: color || '#6B7280',
        icon
      }
    });

    return NextResponse.json(group);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Group name already exists' }, { status: 400 });
    }
    
    console.error('Group creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // First, unassign all vocabulary items from this group
    await prisma.vocabulary.updateMany({
      where: { groupId },
      data: { groupId: null }
    });

    // Then delete the group
    await prisma.group.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Group deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}