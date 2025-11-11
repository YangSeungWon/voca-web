import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';
const APP_GROUP = 'group.kr.ysw.voca';

/**
 * Save token to both localStorage and App Groups (for widget access)
 */
export async function saveToken(token: string): Promise<void> {
  // Save to localStorage for web
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Save to Capacitor Preferences with App Group (for iOS widget)
  try {
    await Preferences.set({
      key: TOKEN_KEY,
      value: token,
    });

    // Also save to shared container for widget
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      await Preferences.set({
        key: `${APP_GROUP}.${TOKEN_KEY}`,
        value: token,
      });
    }
  } catch (error) {
    console.error('Failed to save token to Capacitor:', error);
  }
}

/**
 * Get token from localStorage or Capacitor Preferences
 */
export async function getToken(): Promise<string | null> {
  // Try Capacitor Preferences first (for native apps)
  try {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    if (value) return value;
  } catch (error) {
    console.error('Failed to get token from Capacitor:', error);
  }

  // Fallback to localStorage (for web)
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }

  return null;
}

/**
 * Remove token from both storage locations
 */
export async function removeToken(): Promise<void> {
  // Remove from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }

  // Remove from Capacitor Preferences
  try {
    await Preferences.remove({ key: TOKEN_KEY });

    if ((window as any).Capacitor?.isNativePlatform?.()) {
      await Preferences.remove({ key: `${APP_GROUP}.${TOKEN_KEY}` });
    }
  } catch (error) {
    console.error('Failed to remove token from Capacitor:', error);
  }
}
