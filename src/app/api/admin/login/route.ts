import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }
  return secret;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const adminPassword = getAdminSecret();

    if (password !== adminPassword) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'ADMIN_LOGIN_FAILED',
        timestamp: new Date().toISOString(),
        ip,
      }));
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate admin token (short-lived: 4 hours)
    const token = jwt.sign(
      { isAdmin: true },
      getJwtSecret(),
      { expiresIn: '4h' }
    );

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    console.info(JSON.stringify({
      level: 'INFO',
      type: 'ADMIN_LOGIN_SUCCESS',
      timestamp: new Date().toISOString(),
      ip,
    }));

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
