import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({ theme: 'system', setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (t) => {
      const resolved = t === 'system' ? (media.matches ? 'dark' : 'light') : t;
      root.classList.toggle('dark', resolved === 'dark');
    };
    apply(theme);
    localStorage.setItem('theme', theme);

    const onChange = () => theme === 'system' && apply('system');
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
