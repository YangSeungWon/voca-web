import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .trim();
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

const VALID_TYPES = ['bug', 'suggestion', 'other'];
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const body = await req.json();
    const { type, message, email } = body;

    // Validate type
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type. Must be: bug, suggestion, or other' },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message too short. Minimum 10 characters.' },
        { status: 400 }
      );
    }

    // Validate email if provided
    let sanitizedEmail: string | null = null;
    if (email) {
      if (typeof email !== 'string' || email.length > MAX_EMAIL_LENGTH) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      sanitizedEmail = sanitizeInput(email);
    }

    // Try to get user ID from token (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch {
        // Token invalid, continue as anonymous
      }
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(message);

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        email: sanitizedEmail,
        type,
        message: sanitizedMessage,
        userAgent: userAgent.substring(0, 500), // Limit user agent length
        ip,
      }
    });

    console.info(JSON.stringify({
      level: 'INFO',
      type: 'FEEDBACK_SUBMITTED',
      timestamp: new Date().toISOString(),
      feedbackId: feedback.id,
      feedbackType: type,
      userId: userId || 'anonymous',
      ip,
    }));

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
