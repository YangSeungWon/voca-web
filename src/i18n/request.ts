import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

const isStaticBuild = process.env.BUILD_MODE === 'static';

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale;

  // Only use cookies in non-static builds
  if (!isStaticBuild) {
    try {
      const cookieStore = await cookies();
      const localeCookie = cookieStore.get('locale')?.value;

      if (localeCookie && locales.includes(localeCookie as Locale)) {
        locale = localeCookie as Locale;
      }
    } catch {
      // Fallback to default locale if cookies are not available
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
