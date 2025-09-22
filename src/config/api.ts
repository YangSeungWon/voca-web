// API configuration for different environments
export function getApiUrl(): string {
  // Check if running in Capacitor (mobile app)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    // Mobile app - use production API
    return 'https://voca.ysw.kr';
  }
  
  // Web app - use relative paths
  return '';
}

export function getApiEndpoint(path: string): string {
  const baseUrl = getApiUrl();
  return `${baseUrl}${path}`;
}