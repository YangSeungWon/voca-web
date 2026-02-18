import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

const isStaticBuild = process.env.BUILD_MODE === 'static';

function parseAcceptLanguage(acceptLanguage: string): Locale | null {
  // Parse Accept-Language header and find the best match
  // Example: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=');
      return {
        code: code.toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of languages) {
    // Check exact match first (e.g., "zh-tw" -> "zh-TW")
    const exactMatch = locales.find(l => l.toLowerCase() === code);
    if (exactMatch) return exactMatch;

    // Check language prefix (e.g., "ko-kr" -> "ko", "en-us" -> "en")
    const prefix = code.split('-')[0];
    const prefixMatch = locales.find(l => l.toLowerCase() === prefix);
    if (prefixMatch) return prefixMatch;

    // Special case: zh-hans -> zh, zh-hant -> zh-TW
    if (prefix === 'zh') {
      if (code.includes('hant') || code.includes('tw') || code.includes('hk')) {
        return 'zh-TW';
      }
      return 'zh';
    }
  }

  return null;
}

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale;

  // Only use cookies/headers in non-static builds
  if (!isStaticBuild) {
    try {
      const cookieStore = await cookies();
      const localeCookie = cookieStore.get('locale')?.value;

      if (localeCookie && locales.includes(localeCookie as Locale)) {
        // Use saved preference from cookie
        locale = localeCookie as Locale;
      } else {
        // Detect from browser's Accept-Language header
        const headerStore = await headers();
        const acceptLanguage = headerStore.get('accept-language');
        if (acceptLanguage) {
          const detected = parseAcceptLanguage(acceptLanguage);
          if (detected) {
            locale = detected;
          }
        }
      }
    } catch {
      // Fallback to default locale if cookies/headers are not available
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
