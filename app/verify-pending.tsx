import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Mail, RefreshCcw, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyPendingScreen() {
  const router = useRouter();
  const { email: qsEmail } = useLocalSearchParams<{ email?: string }>();
  const auth = useAuth() as ReturnType<typeof useAuth> | undefined;
  const resend = auth?.resendVerification ?? (async (_email: string) => ({ success: false, error: 'Auth not ready' }));
  const refreshUserData = auth?.refreshUserData ?? (async () => {});
  const [email, setEmail] = useState<string>(typeof qsEmail === 'string' ? qsEmail : '');
  const [checking, setChecking] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [resentOk, setResentOk] = useState<boolean>(false);

  const canContinue = useMemo(() => !!email, [email]);

  useEffect(() => {
    if (typeof qsEmail === 'string' && qsEmail && qsEmail !== email) setEmail(qsEmail);
  }, [qsEmail]);

  const openMailApp = useCallback(() => {
    if (Platform.OS === 'ios') Linking.openURL('message://');
    else if (Platform.OS === 'android') Linking.openURL('mailto:');
  }, []);

  const handleResend = useCallback(async () => {
    if (!email) return;
    setResending(true);
    const r = await resend(email);
    setResending(false);
    setResentOk(!!r.success);
  }, [email, resend]);

  const handleIHaveVerified = useCallback(async () => {
    setChecking(true);
    try {
      const { data } = await supabase.auth.getUser();
      const isVerified = !!data.user?.email_confirmed_at;
      if (!isVerified) {
        await refreshUserData();
      }
      if (isVerified) {
        router.replace('/login');
        return;
      }
    } catch (e) {
    } finally {
      setChecking(false);
    }
  }, [router, refreshUserData]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Verifique seu e-mail' }} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Mail size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Confirme seu e-mail</Text>
        <Text style={styles.subtitle}>
          Enviamos um link de verificação para{email ? `\n${email}` : ' o e-mail informado.'}
        </Text>

        <TouchableOpacity style={styles.mailButton} onPress={openMailApp} testID="open-mail-app">
          <Text style={styles.mailButtonText}>Abrir app de e-mail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, resending && styles.primaryButtonDisabled]}
          onPress={handleResend}
          disabled={!canContinue || resending}
          testID="resend-email"
        >
          {resending ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <>
              <RefreshCcw size={20} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>Reenviar e-mail</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, checking && styles.secondaryButtonDisabled]}
          onPress={handleIHaveVerified}
          disabled={checking}
          testID="i-verified"
        >
          {checking ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <CheckCircle2 size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Já verifiquei</Text>
            </>
          )}
        </TouchableOpacity>

        {resentOk && <Text style={styles.infoText}>E-mail reenviado. Verifique sua caixa de entrada.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  mailButton: { marginTop: 8, backgroundColor: Colors.surface, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  mailButtonText: { color: Colors.text, fontSize: 14, fontWeight: '600' as const },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' as const },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  secondaryButtonDisabled: { opacity: 0.7 },
  secondaryButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '600' as const },
  infoText: { marginTop: 8, fontSize: 13, color: Colors.textSecondary },
});
