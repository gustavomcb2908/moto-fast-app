import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, Text, TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
  errorText?: string;
  testID?: string;
}

export default function Input({ label, errorText, testID, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasError = !!errorText;

  return (
    <View style={styles.container} testID={testID ? `${testID}-container` : undefined}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, hasError ? { borderColor: '#EB5757' } : null, style as any]}
        placeholderTextColor={colors.textLight}
        {...rest}
      />
      {hasError ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { gap: 8 },
    label: { fontSize: 14, color: colors.textSecondary },
    input: {
      height: 52,
      borderRadius: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
    },
    error: { color: '#EB5757', fontSize: 12 },
  });
