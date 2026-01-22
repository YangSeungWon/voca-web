import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken, AUTH_COOKIE_NAME } from '@/lib/jwt';

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      // Log failed login attempt - user not found
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'LOGIN_FAILED',
        reason: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
        ip,
        email,
        userAgent,
      }));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt - wrong password
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'LOGIN_FAILED',
        reason: 'INVALID_PASSWORD',
        timestamp: new Date().toISOString(),
        ip,
        email,
        userAgent,
      }));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log successful login
    console.info(JSON.stringify({
      level: 'INFO',
      type: 'LOGIN_SUCCESS',
      timestamp: new Date().toISOString(),
      ip,
      userId: user.id,
      email,
    }));

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email!
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      userId: user.id,
      token // Keep for backwards compatibility with extensions
    });

    // Set httpOnly cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}