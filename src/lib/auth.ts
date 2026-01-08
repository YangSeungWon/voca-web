export function getUserId(): string {
  if (typeof window === 'undefined') return 'default-user';
  
  // Check for JWT token first
  const token = localStorage.getItem('token');
  if (token) {
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
  }
  
  // Fallback to anonymous user
  let userId = localStorage.getItem('userId');
  if (!userId) {
    // Use crypto for secure random ID generation
    const randomBytes = new Uint8Array(12);
    crypto.getRandomValues(randomBytes);
    const randomStr = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    userId = `user-${Date.now()}-${randomStr}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

export function setUserId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', id);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    window.location.href = '/auth';
  }
}