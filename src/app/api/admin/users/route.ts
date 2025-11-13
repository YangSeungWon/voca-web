import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

const ADMIN_EMAIL = 'yysw1109@gmail.com';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all users with their vocabulary count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            vocabularies: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      vocabularyCount: user._count.vocabularies
    }));

    return NextResponse.json({
      users: formattedUsers,
      totalUsers: users.length,
      totalVocabulary: users.reduce((sum, u) => sum + u._count.vocabularies, 0)
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
