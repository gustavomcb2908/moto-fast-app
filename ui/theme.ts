export const palette = {
  primary: '#D7263D',
  primaryLight: '#F04E60',
  primaryDark: '#A51E30',
  brandGreen: '#27AE60',
  dark: {
    background: '#121212',
    card: '#1A1A1A',
    surface: '#1E1E1E',
    text: '#EDEDED',
    textSecondary: '#B3B3B3',
    border: '#2A2A2A',
  },
  light: {
    background: '#FFFFFF',
    card: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    border: '#E5E5E5',
  },
  feedback: {
    success: '#27AE60',
    warning: '#F2C94C',
    error: '#EB5757',
    info: '#2F80ED',
  },
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const typography = {
  title: { fontSize: 20, fontWeight: '600' as const },
  subtitle: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};
