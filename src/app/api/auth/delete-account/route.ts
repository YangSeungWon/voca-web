import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Delete all related data first (due to foreign key constraints)
    await prisma.$transaction([
      // Delete study sessions
      prisma.studySession.deleteMany({
        where: { userId: user.id }
      }),
      // Delete all user's vocabulary entries
      prisma.vocabulary.deleteMany({
        where: { userId: user.id }
      }),
      // Delete all user's groups
      prisma.group.deleteMany({
        where: { userId: user.id }
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id: user.id }
      })
    ]);

    return NextResponse.json({ 
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}