interface NavigationProps {
  activeView: 'search' | 'vocabulary' | 'study';
  onViewChange: (view: 'search' | 'vocabulary' | 'study') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const tabs = [
    { id: 'search' as const, label: 'Search' },
    { id: 'vocabulary' as const, label: 'My Words' },
    { id: 'study' as const, label: 'Study' },
  ];

  return (
    <nav className="flex space-x-1 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`
            px-4 py-2 text-sm font-medium transition-colors
            ${activeView === tab.id
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}