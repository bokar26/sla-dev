import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import UserMenu from './UserMenu';

export default function Header({ 
  hasStartedChat, 
  activeDashboardTab, 
  setActiveDashboardTab,
  setHasStartedChat,
  setMessages,
  setShowOverviewPage,
  setShowAboutPage
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const searchRef = useRef(null);

  // Dark mode management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Dashboard search options
  const searchOptions = [
    { label: 'Dashboard', tab: 'Dashboard', icon: '🏠' },
    { label: 'SLA Search', tab: 'SLA Search', icon: '🔍' },
    { label: 'Production Portfolio', tab: 'Production Portfolio', icon: '📊' },
    { label: 'Tasks', tab: 'Tasks', icon: '✅' },
    { label: 'Emails', tab: 'Emails', icon: '📧' },
    { label: 'Logistics', tab: 'Logistics', icon: '🚚' },
    { label: 'Orders', tab: 'Orders', icon: '🛒' },
    { label: 'Finances', tab: 'Finances', icon: '💰' },
    { label: 'Integrations', tab: 'Integrations', icon: '🔗' },
    { label: 'Settings', tab: 'Settings', icon: '⚙️' },
  ];

  const filteredOptions = searchOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (tab) => {
    setActiveDashboardTab(tab);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleSearchSelect(filteredOptions[0].tab);
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="w-full h-16 flex items-center justify-between px-6">
        {/* Left: Search */}
        <div className="flex items-center">
          <div className="relative" ref={searchRef}>
            <div className="flex items-center bg-card/60 border border-border rounded-xl px-4 py-3 w-64 h-10 backdrop-blur-sm">
              <Search size={16} className="text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-sm placeholder:text-muted-foreground bg-transparent text-foreground focus:outline-none"
              />
              <div className="flex items-center gap-1 ml-2">
                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">⌘</kbd>
                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">F</kbd>
              </div>
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery && filteredOptions.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-card/90 border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] rounded-xl z-50 backdrop-blur-xl">
                <div className="py-2">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.tab}
                      onClick={() => handleSearchSelect(option.tab)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/60 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="text-base">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
        </div>

        {/* Center: SLA Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => {
              setShowOverviewPage(false);
              setShowAboutPage(false);
              setHasStartedChat(false);
              setMessages([]);
            }}
            className="text-xl font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            SLA
          </button>
        </div>

        {/* Right: Dark Mode Toggle & Profile */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <UserMenu 
            setShowOverviewPage={setShowOverviewPage}
            setShowAboutPage={setShowAboutPage}
            setHasStartedChat={setHasStartedChat}
            setMessages={setMessages}
          />
        </div>
      </div>
    </header>
  );
}
