import Link from 'next/link';
import { Home } from 'lucide-react';

export default function DeleteAccountSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 text-green-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Account Deleted Successfully
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your Voca Web account and all associated data have been permanently deleted.
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Thank you for using Voca Web. We hope to see you again in the future.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <Home size={18} />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}