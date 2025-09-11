export function getUserId(): string {
  if (typeof window === 'undefined') return 'default-user';
  
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