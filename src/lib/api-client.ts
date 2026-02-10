// Centralized API client
// WebView mode: All requests use cookies for authentication (same origin)

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Centralized API client with cookie-based authentication
 */
export async function apiClient(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth: _skipAuth, ...fetchOptions } = options;

  return fetch(path, {
    ...fetchOptions,
    credentials: 'include', // Always include cookies
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
