import { getApiEndpoint } from '@/config/api';
import { getToken } from '@/lib/token-storage';

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
}

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as CapacitorWindow).Capacitor?.isNativePlatform?.();
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Centralized API client that handles authentication automatically
 * - Web: Uses httpOnly cookies (credentials: include)
 * - Mobile (Capacitor): Uses Authorization header
 */
export async function apiClient(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;
  const url = getApiEndpoint(path);

  const headers = new Headers(fetchOptions.headers);

  if (isNativeApp() && !skipAuth) {
    // Mobile: Use Authorization header
    const token = await getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
    credentials: isNativeApp() ? 'omit' : 'include', // Web uses cookies
  });
}

/**
 * Helper for GET requests
 */
export function apiGet(path: string, options: FetchOptions = {}): Promise<Response> {
  return apiClient(path, { ...options, method: 'GET' });
}

/**
 * Helper for POST requests with JSON body
 */
export function apiPost(
  path: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  return apiClient(path, {
    ...options,
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests with JSON body
 */
export function apiPut(
  path: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  return apiClient(path, {
    ...options,
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests
 */
export function apiDelete(path: string, options: FetchOptions = {}): Promise<Response> {
  return apiClient(path, { ...options, method: 'DELETE' });
}

/**
 * Helper for PATCH requests with JSON body
 */
export function apiPatch(
  path: string,
  body?: unknown,
  options: FetchOptions = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  return apiClient(path, {
    ...options,
    method: 'PATCH',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Alias for backwards compatibility
export { apiClient as apiFetch };
