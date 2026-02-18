import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

const isStaticBuild = process.env.BUILD_MODE === 'static';

// Map country codes to locales
const countryToLocale: Record<string, Locale> = {
  KR: 'ko',  // South Korea
  KP: 'ko',  // North Korea
  JP: 'ja',  // Japan
  CN: 'zh',  // China
  TW: 'zh-TW',  // Taiwan
  HK: 'zh-TW',  // Hong Kong
  MO: 'zh-TW',  // Macau
};

// Lazy load geoip-lite to avoid build issues
let geoipLookup: ((ip: string) => { country?: string } | null) | null = null;

async function getGeoIP() {
  if (geoipLookup === null) {
    try {
      const geoip = await import('geoip-lite');
      geoipLookup = geoip.default?.lookup || geoip.lookup;
    } catch {
      geoipLookup = () => null;
    }
  }
  return geoipLookup;
}

function getLocaleFromCountry(country: string | undefined): Locale | null {
  if (!country) return null;
  return countryToLocale[country] || null;
}

function getClientIP(headerStore: Headers): string | null {
  // Check various headers for the real client IP
  const forwardedFor = headerStore.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headerStore.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}

function isPrivateIP(ip: string): boolean {
  return !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.');
}

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
        const headerStore = await headers();

        // 1. Try to detect from IP geolocation (most reliable for country)
        const clientIP = getClientIP(headerStore);
        if (clientIP && !isPrivateIP(clientIP)) {
          try {
            const lookup = await getGeoIP();
            const geo = lookup(clientIP);
            const ipLocale = getLocaleFromCountry(geo?.country);
            if (ipLocale) {
              locale = ipLocale;
            }
          } catch {
            // GeoIP lookup failed, continue with other methods
          }
        }

        // 2. Fallback to Accept-Language header if IP detection didn't work
        if (locale === defaultLocale) {
          const acceptLanguage = headerStore.get('accept-language');
          if (acceptLanguage) {
            const detected = parseAcceptLanguage(acceptLanguage);
            if (detected) {
              locale = detected;
            }
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
