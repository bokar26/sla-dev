import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Share, 
  Plus, 
  Bell, 
  User,
  ChevronDown,
  Command
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

interface AppHeaderProps {
  title: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
  onSearch?: (query: string) => void;
  onShare?: () => void;
  onCreate?: () => void;
  onNotificationClick?: () => void;
  className?: string;
}

export default function AppHeader({
  title,
  breadcrumb,
  onSearch,
  onShare,
  onCreate,
  onNotificationClick,
  className = ""
}: AppHeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // Focus search input
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput?.focus();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onKeyDown={handleKeyDown}
      className={`
        sticky top-0 z-40
        backdrop-blur-md bg-white/80 dark:bg-neutral-900/80
        border-b border-white/60 dark:border-white/10
        shadow-soft
        ${className}
      `}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title & Breadcrumb */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {title}
              </h1>
              {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  {breadcrumb.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span>/</span>}
                      {item.href ? (
                        <a
                          href={item.href}
                          className="hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search... (⌘K)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2
                  bg-background border border-input rounded-lg
                  text-sm placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  focus:border-transparent
                "
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="
                  px-1.5 py-0.5 text-xs font-mono
                  bg-muted text-muted-foreground
                  rounded border
                ">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: Actions & User */}
          <div className="flex items-center gap-3">
            {onShare && (
              <button
                onClick={onShare}
                className="
                  inline-flex items-center gap-2 px-3 py-2
                  text-sm font-medium text-muted-foreground
                  hover:text-foreground hover:bg-muted/50
                  rounded-lg transition-colors
                  focus-visible:ring-2 focus-visible:ring-emerald-500
                "
              >
                <Share className="w-4 h-4" />
                Share
              </button>
            )}
            
            {onCreate && (
              <button
                onClick={onCreate}
                className="
                  inline-flex items-center gap-2 px-4 py-2
                  bg-primary text-primary-foreground
                  rounded-lg font-medium text-sm
                  hover:bg-primary/90
                  transition-colors
                  focus-visible:ring-2 focus-visible:ring-emerald-500
                "
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            )}

            <ThemeToggle />

            {onNotificationClick && (
              <button
                onClick={onNotificationClick}
                className="
                  relative p-2 rounded-lg
                  text-muted-foreground hover:text-foreground
                  hover:bg-muted/50 transition-colors
                  focus-visible:ring-2 focus-visible:ring-emerald-500
                "
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge */}
                <span className="
                  absolute -top-1 -right-1 w-3 h-3
                  bg-destructive rounded-full
                  border-2 border-background
                " />
              </button>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="
                  flex items-center gap-2 p-2 rounded-lg
                  hover:bg-muted/50 transition-colors
                  focus-visible:ring-2 focus-visible:ring-emerald-500
                "
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role || 'Admin'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="
                    absolute right-0 top-full mt-2 w-48
                    backdrop-blur-md bg-white/90 dark:bg-neutral-900/90
                    border border-white/60 dark:border-white/10
                    rounded-lg shadow-glass
                    py-2
                  "
                >
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="text-sm font-medium text-foreground">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button className="
                      w-full px-4 py-2 text-left text-sm
                      text-muted-foreground hover:text-foreground
                      hover:bg-muted/50 transition-colors
                    ">
                      <User className="w-4 h-4 inline mr-2" />
                      Profile
                    </button>
                    <button className="
                      w-full px-4 py-2 text-left text-sm
                      text-muted-foreground hover:text-foreground
                      hover:bg-muted/50 transition-colors
                    ">
                      Settings
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
