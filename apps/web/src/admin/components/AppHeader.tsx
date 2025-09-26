import React, { useState, useEffect } from "react";
import { Bell, Plus, Share2, Search, Moon, Sun } from "lucide-react";

export default function AppHeader() {
  const [isDark, setIsDark] = useState(false);

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

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
      <div className="px-6 py-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200" 
            placeholder="Search…" 
          />
        </div>
        <button className="px-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-700/80 flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
          <Share2 className="w-4 h-4"/>
          Share
        </button>
        <button className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg">
          <Plus className="w-4 h-4"/>
          Create
        </button>
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="p-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
          <Bell className="w-4 h-4"/>
        </button>
      </div>
    </header>
  );
}
