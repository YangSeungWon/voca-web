'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function AuthStatus() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setUserEmail(localStorage.getItem('userEmail'));
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    router.push('/auth');
  };

  if (loggedIn) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-600">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-3 py-1 text-xs bg-gray-800 text-white rounded-sm hover:bg-gray-700"
    >
      Login
    </button>
  );
}