interface NavigationProps {
  activeView: 'search' | 'vocabulary' | 'study';
  onViewChange: (view: 'search' | 'vocabulary' | 'study') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
  const tabs = [
    { id: 'vocabulary' as const, label: 'Word List' },
    { id: 'search' as const, label: 'Add New' },
    { id: 'study' as const, label: 'Review' },
  ];

  return (
    <nav className="flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`
            px-4 py-2 text-xs font-medium border border-gray-300
            ${activeView === tab.id
              ? 'bg-white text-gray-800 border-b-white -mb-px z-10'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
            }
            ${tab.id === 'vocabulary' ? 'rounded-tl-sm' : ''}
            ${tab.id === 'study' ? 'rounded-tr-sm' : ''}
            ${tab.id !== 'study' ? 'border-r-0' : ''}
          `}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}