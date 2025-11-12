import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';

/**
 * Save token to localStorage, Capacitor Preferences, and notify iOS for App Groups sync
 */
export async function saveToken(token: string): Promise<void> {
  // Save to localStorage for web and quick access
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Save to Capacitor Preferences for native persistence
  try {
    await Preferences.set({
      key: TOKEN_KEY,
      value: token,
    });
  } catch (error) {
    console.error('[TokenStorage] Failed to save to Preferences:', error);
  }

  // Notify iOS to sync token to App Groups (for widget access)
  notifyIOSTokenUpdate(token);
}

/**
 * Notify iOS native code to save token to App Groups
 * Uses WKScriptMessageHandler - iOS AppDelegate listens for this message
 */
function notifyIOSTokenUpdate(token: string): void {
  if (typeof window === 'undefined') return;

  const isNative = (window as any).Capacitor?.isNativePlatform?.();
  const isIOS = (window as any).Capacitor?.getPlatform?.() === 'ios';

  if (isNative && isIOS) {
    try {
      // Check if webkit message handler is available
      if ((window as any).webkit?.messageHandlers?.saveTokenToAppGroups) {
        (window as any).webkit.messageHandlers.saveTokenToAppGroups.postMessage(token);
        console.log('[TokenStorage] Token sync notification sent to iOS');
      } else {
        console.log('[TokenStorage] iOS message handler not ready yet');
      }
    } catch (error) {
      console.error('[TokenStorage] Failed to notify iOS:', error);
    }
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
 * Remove token from all storage locations
 */
export async function removeToken(): Promise<void> {
  // Remove from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }

  // Remove from Capacitor Preferences
  try {
    await Preferences.remove({ key: TOKEN_KEY });
  } catch (error) {
    console.error('[TokenStorage] Failed to remove from Preferences:', error);
  }

  // Clear token from App Groups by sending empty string
  notifyIOSTokenUpdate('');
}
