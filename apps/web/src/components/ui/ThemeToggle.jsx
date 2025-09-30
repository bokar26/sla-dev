import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme, toggle } = useTheme();

  const cycle = () => {
    // cycle through: light -> dark -> system -> light
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  };

  const label = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${label}`}
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors
      border-slate-300 bg-white text-slate-700 hover:bg-slate-50
      dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${className}`}
    >
      <span className="relative w-4 h-4">
        <Sun className="absolute inset-0 h-4 w-4 transition-opacity dark:opacity-0" />
        <Moon className="absolute inset-0 h-4 w-4 transition-opacity opacity-0 dark:opacity-100" />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
