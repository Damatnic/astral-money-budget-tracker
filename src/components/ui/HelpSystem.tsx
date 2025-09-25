'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: number;
  showArrow?: boolean;
}

interface HelpContextType {
  isHelpMode: boolean;
  toggleHelpMode: () => void;
  showHelp: (key: string) => void;
  hideHelp: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

/**
 * Professional tooltip component with advanced positioning
 */
export function Tooltip({
  content,
  children,
  position = 'auto',
  delay = 300,
  disabled = false,
  className = '',
  maxWidth = 300,
  showArrow = true
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalPosition = position;
    let x = 0;
    let y = 0;

    // Auto positioning logic
    if (position === 'auto') {
      const spaceTop = triggerRect.top;
      const spaceBottom = viewportHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;
      
      if (spaceTop > tooltipRect.height + 10) {
        finalPosition = 'top';
      } else if (spaceBottom > tooltipRect.height + 10) {
        finalPosition = 'bottom';
      } else if (spaceRight > tooltipRect.width + 10) {
        finalPosition = 'right';
      } else if (spaceLeft > tooltipRect.width + 10) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom'; // fallback
      }
    }

    // Calculate coordinates based on final position
    switch (finalPosition) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(8, Math.min(x, viewportWidth - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, viewportHeight - tooltipRect.height - 8));

    setActualPosition(finalPosition);
    setCoords({ x, y });
  };

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after tooltip is rendered
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, content]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            maxWidth: `${maxWidth}px`,
          }}
        >
          {content}
          {showArrow && (
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                actualPosition === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                actualPosition === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                actualPosition === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`}
            />
          )}
        </div>
      )}
    </>
  );
}

/**
 * Help Provider component
 */
export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const toggleHelpMode = () => setIsHelpMode(!isHelpMode);
  const showHelp = (key: string) => setActiveHelp(key);
  const hideHelp = () => setActiveHelp(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        toggleHelpMode();
      } else if (event.key === 'Escape' && isHelpMode) {
        setIsHelpMode(false);
        hideHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpMode]);

  return (
    <HelpContext.Provider value={{
      isHelpMode,
      toggleHelpMode,
      showHelp,
      hideHelp
    }}>
      {children}
      {isHelpMode && (
        <div className="fixed inset-0 bg-blue-500/20 z-40 pointer-events-none">
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Help Mode - Press F1 to exit
          </div>
        </div>
      )}
    </HelpContext.Provider>
  );
}

/**
 * Help Center Modal
 */
export function HelpCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const helpContent = {
    'getting-started': {
      title: 'Getting Started',
      category: 'basics',
      content: 'Learn the basics of using Astral Money to track your finances.',
      keywords: ['start', 'begin', 'basics', 'intro']
    },
    'add-transaction': {
      title: 'Adding Transactions',
      category: 'transactions',
      content: 'Add income and expense transactions to track your money flow.',
      keywords: ['add', 'transaction', 'income', 'expense']
    },
    'recurring-bills': {
      title: 'Recurring Bills',
      category: 'bills',
      content: 'Set up and manage recurring bills and subscriptions.',
      keywords: ['recurring', 'bills', 'subscriptions', 'repeat']
    },
    'reports': {
      title: 'Financial Reports',
      category: 'reports',
      content: 'Generate and view detailed financial reports and analytics.',
      keywords: ['reports', 'analytics', 'insights', 'graphs']
    }
  };

  const categories = [
    { id: 'all', label: 'All Topics', count: Object.keys(helpContent).length },
    { id: 'basics', label: 'Basics', count: 1 },
    { id: 'transactions', label: 'Transactions', count: 1 },
    { id: 'bills', label: 'Bills', count: 1 },
    { id: 'reports', label: 'Reports', count: 1 }
  ];

  const filteredHelp = Object.entries(helpContent).filter(([key, help]) => {
    const matchesSearch = searchTerm === '' || 
      help.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      help.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      help.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || help.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Help Center</h2>
            <p className="text-gray-700 mt-1">Find answers and learn how to use Astral Money</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Close help center"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700" />
                <input
                  type="text"
                  placeholder="Search help..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex-1 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-900 font-medium'
                          : 'text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.label}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredHelp.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-700">Try adjusting your search or browse categories</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHelp.map(([key, help]) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{help.title}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-900 text-xs rounded-full capitalize">
                        {help.category.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-gray-700">
                      {help.content}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {help.keywords.map(keyword => (
                        <span
                          key={keyword}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to use help context
 */
export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
}

/**
 * Quick help button component
 */
export function HelpButton({ className = '' }: { className?: string }) {
  const [showCenter, setShowCenter] = useState(false);
  
  return (
    <>
      <Tooltip content="Help & Support (F1)">
        <button
          onClick={() => setShowCenter(true)}
          className={`p-2 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100 ${className}`}
          aria-label="Open help center"
        >
          <QuestionMarkIcon className="w-5 h-5" />
        </button>
      </Tooltip>
      
      <HelpCenter isOpen={showCenter} onClose={() => setShowCenter(false)} />
    </>
  );
}

// Icon Components
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const QuestionMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Tooltip;