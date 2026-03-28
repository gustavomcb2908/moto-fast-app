import React, { PropsWithChildren, useMemo } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Card({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, style as any]} {...rest}>
      <LinearGradient
        colors={[colors.primary + '22', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBG}
      />
      {children}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    gradientBG: {
      ...StyleSheet.absoluteFillObject as any,
      opacity: 1,
    },
  });
