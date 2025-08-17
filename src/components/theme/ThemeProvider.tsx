// src/components/theme/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean; // Added this missing prop
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
  systemTheme: 'dark' | 'light';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
  systemTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'expense-tracker-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false, // Added with default value
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light');
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme
  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Update theme on document
  const updateTheme = (newTheme: 'dark' | 'light') => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    
    // Disable transitions during theme change if requested
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
        )
      );
      document.head.appendChild(css);

      // Force reflow
      (() => window.getComputedStyle(document.body))();

      // Remove transitions after a frame
      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    }

    root.classList.remove('light', 'dark');

    if (attribute === 'class') {
      root.classList.add(newTheme);
    } else {
      root.setAttribute(attribute, newTheme);
    }

    // Also set data attribute for easier CSS targeting
    root.setAttribute('data-theme', newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Get system theme
    const currentSystemTheme = getSystemTheme();
    setSystemTheme(currentSystemTheme);

    // Get stored theme or use default
    let storedTheme = defaultTheme;
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        storedTheme = item as Theme;
      }
    } catch (e) {
      // localStorage might not be available
      console.warn('Failed to read theme from localStorage:', e);
    }

    setTheme(storedTheme);

    // Set initial theme
    const initialTheme = storedTheme === 'system' && enableSystem 
      ? currentSystemTheme 
      : (storedTheme as 'dark' | 'light');
    
    setActualTheme(initialTheme);
    updateTheme(initialTheme);
  }, [defaultTheme, storageKey, enableSystem, attribute]);

  // Update theme when theme state changes
  useEffect(() => {
    if (!mounted) return;

    let effectiveTheme: 'dark' | 'light' = 'light';

    if (theme === 'system' && enableSystem) {
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme as 'dark' | 'light';
    }

    setActualTheme(effectiveTheme);
    updateTheme(effectiveTheme);
  }, [theme, systemTheme, enableSystem, mounted, attribute]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [enableSystem]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }
      setTheme(newTheme);
    },
    actualTheme,
    systemTheme,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Updated theme toggle component with better icons
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <button
      onClick={() => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
      }}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={`Current theme: ${theme}. Click to switch.`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
    >
      {actualTheme === 'dark' ? (
        // Sun icon for dark mode (switch to light)
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Moon icon for light mode (switch to dark)
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

// Advanced theme toggle with system option
export function ThemeToggleAdvanced({ className = '' }: { className?: string }) {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    { 
      value: 'light' as const, 
      label: 'Light', 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      value: 'dark' as const, 
      label: 'Dark', 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )
    },
    { 
      value: 'system' as const, 
      label: 'System', 
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      )
    },
  ];

  return (
    <div className={`flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
            theme === t.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title={`Switch to ${t.label} theme`}
          aria-label={`Switch to ${t.label} theme`}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// Theme-aware component wrapper
export function ThemeAware({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const { actualTheme } = useTheme();
  
  return (
    <div data-theme={actualTheme} className={`${actualTheme} ${className}`}>
      {children}
    </div>
  );
}

// Hook to get theme information
export function useThemeInfo() {
  const { theme, actualTheme, systemTheme } = useTheme();
  
  return {
    theme,
    actualTheme,
    systemTheme,
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
    isSystemTheme: theme === 'system',
  };
}