import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const LIGHT_COLORS = {
  background: '#f5f5f5',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  primary: '#21c45d',
  destructive: '#dc2626',
};

const DARK_COLORS = {
  background: '#0f172a',
  foreground: '#f8fafc',
  card: '#111827',
  cardForeground: '#f8fafc',
  muted: '#94a3b8',
  border: '#334155',
  primary: '#22c55e',
  destructive: '#f87171',
};

const THEME_STORAGE_KEY = 'displayMode';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'bright' || storedTheme === 'dark' || storedTheme === 'system') {
          setTheme(storedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'light');
    });

    return () => {
      listener.remove();
    };
  }, []);

  const effectiveTheme = useMemo(() => {
    if (theme === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'bright';
    }
    return theme;
  }, [theme, systemScheme]);

  const colors = useMemo(() => {
    return effectiveTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }, [effectiveTheme]);

  const updateTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const value = {
    theme,
    effectiveTheme,
    colors,
    setTheme: updateTheme,
    isThemeLoaded: isLoaded,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};