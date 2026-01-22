import { apiPost } from './api-client';
import { removeToken, getToken } from './token-storage';

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
}

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as CapacitorWindow).Capacitor?.isNativePlatform?.();
}

export function getUserId(): string {
  if (typeof window === 'undefined') return 'default-user';

  // Check for userId in localStorage
  const userId = localStorage.getItem('userId');
  if (userId) return userId;

  // Generate anonymous user ID
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  const randomStr = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const newUserId = `user-${Date.now()}-${randomStr}`;
  localStorage.setItem('userId', newUserId);
  return newUserId;
}

export function setUserId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', id);
  }
}

export async function getAuthToken(): Promise<string | null> {
  return getToken();
}

export async function isAuthenticated(): Promise<boolean> {
  if (isNativeApp()) {
    // Mobile: check token storage
    const token = await getToken();
    return !!token;
  }
  // Web: check userId (cookie is httpOnly, can't check directly)
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('userId');
}

export async function logout() {
  if (typeof window === 'undefined') return;

  try {
    // Call logout API to clear cookie
    await apiPost('/api/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  }

  // Clear local storage
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');

  // Clear mobile token storage
  await removeToken();

  window.location.href = '/auth';
}