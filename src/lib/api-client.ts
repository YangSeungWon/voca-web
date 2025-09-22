import { getApiEndpoint } from '@/config/api';

// Wrapper for fetch that handles API endpoint resolution
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getApiEndpoint(path);
  return fetch(url, options);
}