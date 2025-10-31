import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type Button = { text: string; onPress?: () => void; role?: 'cancel' | 'destructive' | 'default' };

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  buttons: Button[];
}

interface DialogContextValue {
  alert: (title: string, message: string, buttons?: Button[]) => void;
  confirm: (title: string, message: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function ThemedDialogProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [state, setState] = useState<DialogState>({ visible: false, title: '', message: '', buttons: [] });

  const alert = useCallback((title: string, message: string, buttons?: Button[]) => {
    const btns = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
    setState({ visible: true, title, message, buttons: btns });
  }, []);

  const confirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({
        visible: true,
        title,
        message,
        buttons: [
          { text: 'Cancelar', role: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirmar', onPress: () => resolve(true) },
        ],
      });
    });
  }, []);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    card: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    title: { fontSize: 18, fontWeight: '700' as const, color: colors.text, marginBottom: 8 },
    message: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
    buttonsRow: { flexDirection: 'row', gap: 12 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    btnText: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
    btnTextPrimary: { color: colors.surface },
    btnTextDestructive: { color: '#EF4444' },
  }), [colors]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal transparent visible={state.visible} animationType="slide" onRequestClose={() => setState((s) => ({ ...s, visible: false }))}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {!!state.title && <Text style={styles.title}>{state.title}</Text>}
            {!!state.message && <Text style={styles.message}>{state.message}</Text>}
            <View style={styles.buttonsRow}>
              {state.buttons.map((b, i) => {
                const isPrimary = b.role !== 'cancel' && b.role !== 'destructive' && i === state.buttons.length - 1;
                return (
                  <TouchableOpacity
                    key={`${b.text}-${i}`}
                    style={[styles.btn, isPrimary && styles.btnPrimary]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setState((s) => ({ ...s, visible: false }));
                      requestAnimationFrame(() => b.onPress?.());
                    }}
                  >
                    <Text style={[styles.btnText, isPrimary && styles.btnTextPrimary, b.role === 'destructive' && styles.btnTextDestructive]}>{b.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useThemedDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  return ctx as DialogContextValue;
}
