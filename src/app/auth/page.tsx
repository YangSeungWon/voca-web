'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { saveToken } from '@/lib/token-storage';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = { email, password };

      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
      const apiUrl = isCapacitor ? 'https://voca.ysw.kr' : '';
      const fullUrl = `${apiUrl}${endpoint}`;

      console.log('[Auth] Attempting authentication:', {
        endpoint,
        isLogin,
        email,
        apiUrl: isCapacitor ? 'Capacitor detected' : 'Web mode'
      });

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log('[Auth] Response received:', {
        status: response.status,
        ok: response.ok,
        headers: response.headers
      });

      let data;
      try {
        data = await response.json();
        console.log('[Auth] Response data:', data);
      } catch (jsonError) {
        console.error('[Auth] Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        console.error('[Auth] Authentication failed:', data);
        setError(data.error || 'Authentication failed');
        return;
      }

      // Store token and user info
      await saveToken(data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);

      console.log('[Auth] Authentication successful, redirecting...');

      // Redirect to main page
      router.push('/');
    } catch (error) {
      console.error('[Auth] Error during authentication:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-sm border border-gray-200 dark:border-gray-700 shadow-sm w-96">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="text-xs text-red-500">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-800 dark:bg-gray-700 text-white text-sm font-medium rounded-sm hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-800 dark:text-gray-200 hover:underline font-medium"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}