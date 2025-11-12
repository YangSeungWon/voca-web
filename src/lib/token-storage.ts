import { Preferences } from '@capacitor/preferences';
import { registerPlugin } from '@capacitor/core';

const TOKEN_KEY = 'token';

interface AppGroupStoragePlugin {
  set(options: { key: string; value: string }): Promise<void>;
  get(options: { key: string }): Promise<{ value: string | null }>;
  remove(options: { key: string }): Promise<void>;
}

const AppGroupStorage = registerPlugin<AppGroupStoragePlugin>('AppGroupStorage');

/**
 * Save token to both localStorage and App Groups (for widget access)
 */
export async function saveToken(token: string): Promise<void> {
  // Save to localStorage for web
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Save to Capacitor Preferences
  try {
    await Preferences.set({
      key: TOKEN_KEY,
      value: token,
    });

    // Save to App Groups for iOS widget access
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      try {
        await AppGroupStorage.set({
          key: TOKEN_KEY,
          value: token,
        });
        console.log('Token saved to App Groups for widget');
      } catch (error) {
        console.error('Failed to save token to App Groups:', error);
      }
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

    // Remove from App Groups
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      try {
        await AppGroupStorage.remove({ key: TOKEN_KEY });
        console.log('Token removed from App Groups');
      } catch (error) {
        console.error('Failed to remove token from App Groups:', error);
      }
    }
  } catch (error) {
    console.error('Failed to remove token from Capacitor:', error);
  }
}
