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
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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