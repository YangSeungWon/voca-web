import { NextRequest, NextResponse } from 'next/server';
import { locales, type Locale } from '@/i18n/config';

export async function POST(req: NextRequest) {
  try {
    const { locale } = await req.json();

    if (!locale || !locales.includes(locale as Locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, locale });

    // Set cookie for 1 year
    response.cookies.set('locale', locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set locale' },
      { status: 500 }
    );
  }
}
