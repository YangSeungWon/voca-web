import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, getJwtSecret()) as JWTPayload;
}

// Cookie name for auth token
export const AUTH_COOKIE_NAME = 'auth_token';

// Get token from request (cookie first, then Authorization header for backwards compatibility)
export function getTokenFromRequest(req: NextRequest): string | null {
  // Try cookie first
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header (for backwards compatibility with extensions)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

// Authenticate request and return payload or null
export function authenticateRequest(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}