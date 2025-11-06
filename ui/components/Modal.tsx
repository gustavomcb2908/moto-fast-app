import React, { PropsWithChildren, useMemo } from 'react';
import { Modal as RNModal, View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function Modal({ visible, onClose, children }: PropsWithChildren<Props>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <RNModal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View style={styles.sheet}>
        {children}
      </View>
    </RNModal>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject as any,
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)' as any,
    },
    sheet: {
      margin: 24,
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
