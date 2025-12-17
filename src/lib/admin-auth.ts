import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

interface AdminPayload {
  isAdmin: boolean;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export function verifyAdminToken(token: string): AdminPayload {
  const payload = jwt.verify(token, getJwtSecret()) as AdminPayload;
  if (!payload.isAdmin) {
    throw new Error('Not an admin token');
  }
  return payload;
}

export function isAdminRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyAdminToken(token);
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}
