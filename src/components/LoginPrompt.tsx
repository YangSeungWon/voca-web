'use client';

import { useRouter } from 'next/navigation';

interface LoginPromptProps {
  message?: string;
}

export default function LoginPrompt({ message = 'Please sign in to continue' }: LoginPromptProps) {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="mb-6">
        <svg
          className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Sign In Required
      </h2>

      <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        {message}
      </p>

      <button
        onClick={handleSignIn}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Sign In
      </button>
    </div>
  );
}
