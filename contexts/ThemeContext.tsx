import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  card: string;
  border: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  textSecondary: string;
  textLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const LIGHT: ThemeColors = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  primary: '#D7263D',
  card: '#F5F5F5',
  border: '#E5E5E5',
  accent: '#27AE60',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  textSecondary: '#6B6B6B',
  textLight: '#9CA3AF',
  success: '#27AE60',
  warning: '#F2C94C',
  error: '#EB5757',
  info: '#2F80ED',
};

const DARK: ThemeColors = {
  background: '#121212',
  text: '#EDEDED',
  primary: '#D7263D',
  card: '#1A1A1A',
  border: '#2A2A2A',
  accent: '#27AE60',
  surface: '#1E1E1E',
  surfaceAlt: '#222222',
  textSecondary: '#B3B3B3',
  textLight: '#9CA3AF',
  success: '#27AE60',
  warning: '#F2C94C',
  error: '#EB5757',
  info: '#2F80ED',
};

interface ThemeState {
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const STORAGE_KEY = '@motofast-theme';

export const [ThemeProvider, useTheme] = createContextHook<ThemeState>(() => {
  const system = useColorScheme();
  const [choice, setChoice] = useState<ThemeChoice>('dark');
  const [hydrated, setHydrated] = useState<boolean>(false);
  const loadedRef = useRef<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setChoice(saved);
        }
      } catch (e) {
        console.log('Failed to load theme', e);
      } finally {
        setHydrated(true);
        loadedRef.current = true;
      }
    })();
  }, []);

  const setChoicePersist = useCallback((next: ThemeChoice) => {
    setChoice(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((e) => console.log('Failed to persist theme', e));
  }, []);

  const isDark = useMemo(() => {
    if (choice === 'system') return system === 'dark';
    return choice === 'dark';
  }, [choice, system]);

  const colors = useMemo<ThemeColors>(() => (isDark ? DARK : LIGHT), [isDark]);

  return useMemo(() => ({
    choice,
    setChoice: setChoicePersist,
    isDark,
    colors,
  }), [choice, setChoicePersist, isDark, colors]);
});
