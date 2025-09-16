export default function SkeletonLoader({ type = 'card' }: { type?: 'card' | 'table' | 'list' }) {
  if (type === 'table') {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-2">
            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded flex-1" />
            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-32" />
            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  // Card skeleton
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded" />
        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-5/6" />
        <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-4/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}