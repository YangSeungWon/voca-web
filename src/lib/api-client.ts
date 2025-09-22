import { getApiEndpoint } from '@/config/api';

// Wrapper for fetch that handles API endpoint resolution
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getApiEndpoint(path);
  console.log('[API Client] Making request to:', url);
  console.log('[API Client] Request options:', options);

  // Enhanced options for mobile environment
  const enhancedOptions: RequestInit = {
    ...options,
    mode: 'cors',
    credentials: 'omit', // Don't send cookies for cross-origin requests
  };

  try {
    const response = await fetch(url, enhancedOptions);
    console.log('[API Client] Response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Client] Request failed:', error);
    console.error('[API Client] Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      type: (error as any)?.constructor?.name
    });
    throw error;
  }
}