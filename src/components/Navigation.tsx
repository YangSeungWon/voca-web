interface NavigationProps {
  activeView: 'search' | 'vocabulary' | 'study' | 'statistics' | 'phonetics';
  onViewChange: (view: 'search' | 'vocabulary' | 'study' | 'statistics' | 'phonetics') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const tabs = [
    { id: 'vocabulary' as const, label: 'Word List' },
    { id: 'search' as const, label: 'Add New' },
    { id: 'study' as const, label: 'Review' },
    { id: 'statistics' as const, label: 'Statistics' },
    { id: 'phonetics' as const, label: 'IPA' },
  ];

  return (
    <nav className="flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`
            px-4 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600
            ${activeView === tab.id
              ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-b-white dark:border-b-gray-800 -mb-px z-10'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
            }
            ${tab.id === 'vocabulary' ? 'rounded-tl-sm' : ''}
            ${tab.id === 'phonetics' ? 'rounded-tr-sm' : ''}
            ${tab.id !== 'phonetics' ? 'border-r-0' : ''}
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}