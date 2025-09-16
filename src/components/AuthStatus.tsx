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

  const handlePhonetics = () => {
    router.push('/phonetics');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePhonetics}
        className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50"
        title="IPA Phonetics Reference"
      >
        IPA
      </button>
      
      {loggedIn ? (
        <>
          <span className="text-xs text-gray-600">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="px-3 py-1 text-xs bg-gray-800 text-white rounded-sm hover:bg-gray-700"
        >
          Login
        </button>
      )}
    </div>
  );
}