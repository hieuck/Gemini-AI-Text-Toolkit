import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

type ThemeSetting = 'light' | 'dark' | 'auto';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themeSetting: ThemeSetting;
  setThemeSetting: (theme: ThemeSetting) => void;
  theme: EffectiveTheme; // The actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeSetting;
    // Validate that the saved theme is one of the allowed values
    if (['light', 'dark', 'auto'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'auto';
  });

  const [theme, setTheme] = useState<EffectiveTheme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isSystemDark = mediaQuery.matches;
      let newTheme: EffectiveTheme;

      if (themeSetting === 'auto') {
        newTheme = isSystemDark ? 'dark' : 'light';
      } else {
        newTheme = themeSetting;
      }
      
      setTheme(newTheme);

      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      localStorage.setItem('theme', themeSetting);
    };

    updateTheme();

    // Listen for changes in system preference
    mediaQuery.addEventListener('change', updateTheme);
    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [themeSetting]);

  const value = useMemo(() => ({ theme, themeSetting, setThemeSetting }), [theme, themeSetting]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};