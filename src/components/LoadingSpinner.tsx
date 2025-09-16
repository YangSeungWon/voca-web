export default function LoadingSpinner({ size = 'md', fullScreen = false }: { size?: 'sm' | 'md' | 'lg', fullScreen?: boolean }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-3 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}