interface NavigationProps {
  activeView: 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more';
  onViewChange: (view: 'home' | 'vocabulary' | 'study' | 'statistics' | 'phonetics' | 'more') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const tabs = [
    { id: 'home' as const, label: 'Home' },
    { id: 'vocabulary' as const, label: 'Words' },
    { id: 'study' as const, label: 'Review' },
    { id: 'statistics' as const, label: 'Statistics' },
    { id: 'phonetics' as const, label: 'IPA' },
  ];

  return (
    <nav className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`
            px-6 py-2.5 text-sm font-medium rounded-lg transition-all
            ${activeView === tab.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}