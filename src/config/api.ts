// API configuration for different environments
export function getApiUrl(): string {
  // Check if running in Capacitor (mobile app)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    // Mobile app - use production API
    console.log('[API Config] Running in Capacitor - using production API');
    return 'https://voca.ysw.kr';
  }

  // Web app - use relative paths
  console.log('[API Config] Running in web - using relative paths');
  return '';
}

export function getApiEndpoint(path: string): string {
  const baseUrl = getApiUrl();
  const fullUrl = `${baseUrl}${path}`;
  console.log('[API Config] Full API endpoint:', fullUrl);
  return fullUrl;
}