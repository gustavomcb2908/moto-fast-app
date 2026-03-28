import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  testID?: string;
}

export default function Button({ title, onPress, disabled = false, loading = false, variant = 'primary', testID }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const containerStyle = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border };
      case 'ghost':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'danger':
        return { backgroundColor: '#EB5757' };
      default:
        return { backgroundColor: 'transparent' };
    }
  }, [variant, colors]);

  return (
    <TouchableOpacity
      style={[styles.button, containerStyle, disabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      testID={testID}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={[colors.primary, '#1F8E4D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.text : colors.surface} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.title, { color: variant === 'ghost' || variant === 'secondary' ? colors.text : colors.surface }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    button: {
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    disabled: { opacity: 0.6 },
  });
