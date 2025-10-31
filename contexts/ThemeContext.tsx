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
  text: '#111111',
  primary: '#00C853',
  card: '#F7F7F7',
  border: '#E0E0E0',
  accent: '#00C853',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const DARK: ThemeColors = {
  background: '#121212',
  text: '#EAEAEA',
  primary: '#00C853',
  card: '#1E1E1E',
  border: '#333333',
  accent: '#00C853',
  surface: '#1E1E1E',
  surfaceAlt: '#212121',
  textSecondary: '#B3B3B3',
  textLight: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
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
  const [choice, setChoice] = useState<ThemeChoice>('system');
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
