import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { LogIn } from 'lucide-react-native';

interface Props {
  location?: 'welcome' | 'login' | 'other';
  style?: ViewStyle;
}

export function BypassDemoButton({ location = 'other', style }: Props) {
  const { bypassDemoLogin } = useAuth() as ReturnType<typeof useAuth> & { bypassDemoLogin: () => Promise<{ success: boolean; error?: string }>; };

  const handleBypass = useCallback(async () => {
    const res = await bypassDemoLogin();
    if (res.success) {
      router.replace('/(tabs)');
    } else {
      console.log('Bypass demo failed');
    }
  }, [bypassDemoLogin]);

  const variant = useMemo(() => {
    switch (location) {
      case 'welcome':
        return styles.welcome;
      case 'login':
        return styles.login;
      default:
        return styles.defaultStyle;
    }
  }, [location]);

  return (
    <TouchableOpacity
      onPress={handleBypass}
      style={[styles.base, variant, style]}
      accessibilityRole="button"
      testID={`bypass-demo-${location}`}
      activeOpacity={0.8}
    >
      <LogIn size={14} color={variant.color as string} />
      <Text style={[styles.text, { color: variant.color as string }]}>Explorar sem login</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  text: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  welcome: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  } as ViewStyle & { color: string },
  login: {
    backgroundColor: Colors.surface,
    color: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle & { color: string },
  defaultStyle: {
    backgroundColor: Colors.background,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle & { color: string },
});
