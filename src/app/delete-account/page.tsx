'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      
      // Redirect to confirmation page
      router.push('/delete-account/success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-6">
            Delete Account - Voca Web
          </h1>
          
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <h2 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Warning: This action cannot be undone
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Deleting your account will permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>All your saved vocabulary words</li>
              <li>Your study progress and statistics</li>
              <li>Your account information</li>
              <li>All associated data</li>
            </ul>
            <p className="text-sm text-red-700 dark:text-red-300 mt-3">
              Data will be deleted immediately and cannot be recovered.
            </p>
          </div>

          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type <span className="font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Type DELETE"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isDeleting || confirmText !== 'DELETE'}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Need help?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you have any questions about account deletion, please contact us at{' '}
              <a href="mailto:yysw1109@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                yysw1109@gmail.com
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Or visit our{' '}
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </a>
              {' '}for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}