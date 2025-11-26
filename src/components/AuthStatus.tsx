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

  return (
    <div className="flex items-center gap-2">
      {loggedIn ? (
        <>
          <span className="text-xs text-gray-600">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="px-3 py-1 text-xs bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          Login
        </button>
      )}
    </div>
  );
}