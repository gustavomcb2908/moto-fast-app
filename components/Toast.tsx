import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';
import { palette } from '@/ui/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getIcon = () => {
    const iconSize = 20;
    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color="#FFF" />;
      case 'error':
        return <XCircle size={iconSize} color="#FFF" />;
      case 'warning':
        return <AlertCircle size={iconSize} color="#FFF" />;
      case 'info':
        return <Info size={iconSize} color="#FFF" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
          backgroundColor: palette.primary,
        };
      case 'error':
        return {
          background: `linear-gradient(135deg, ${palette.feedback.error} 0%, #C53030 100%)`,
          backgroundColor: palette.feedback.error,
        };
      case 'warning':
        return {
          background: `linear-gradient(135deg, ${palette.feedback.warning} 0%, #D4A017 100%)`,
          backgroundColor: palette.feedback.warning,
        };
      case 'info':
        return {
          background: `linear-gradient(135deg, ${palette.feedback.info} 0%, #1E5BA8 100%)`,
          backgroundColor: palette.feedback.info,
        };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: colors.backgroundColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    lineHeight: 20,
  },
});

class ToastManager {
  private listeners: ((toast: ToastState) => void)[] = [];
  private currentToast: ToastState | null = null;

  subscribe(listener: (toast: ToastState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  show(message: string, type: ToastType = 'info', duration = 3000) {
    this.currentToast = { message, type, duration, visible: true };
    this.listeners.forEach((listener) => listener(this.currentToast!));
  }

  hide() {
    if (this.currentToast) {
      this.currentToast = { ...this.currentToast, visible: false };
      this.listeners.forEach((listener) => listener(this.currentToast!));
    }
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
}

export const toast = new ToastManager();

interface ToastState {
  message: string;
  type: ToastType;
  duration: number;
  visible: boolean;
}

export function ToastContainer() {
  const [toastState, setToastState] = React.useState<ToastState | null>(null);

  useEffect(() => {
    const unsubscribe = toast.subscribe((state) => {
      setToastState(state);
    });

    return unsubscribe;
  }, []);

  if (!toastState) return null;

  return (
    <Toast
      message={toastState.message}
      type={toastState.type}
      duration={toastState.duration}
      visible={toastState.visible}
      onHide={() => toast.hide()}
    />
  );
}
