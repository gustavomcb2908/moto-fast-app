import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CreditCard } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { router } from 'expo-router';

export default function PayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState<boolean>(false);
  const params = useLocalSearchParams<{ invoiceId?: string; amount?: string }>();

  const [invoices, setInvoices] = React.useState<{ id: string; amount: number }[]>([]);
  React.useEffect(() => {
    if (params.invoiceId) return;
    (async () => {
      const { data } = await supabase
        .from('invoices')
        .select('id, amount, status')
        .eq('status', 'pending')
        .order('due_date', { ascending: true });
      const mapped = (data ?? []).map((d: any) => ({ id: String(d.id), amount: Number(d.amount ?? 0) }));
      setInvoices(mapped);
    })();
  }, [params.invoiceId]);

  const targetInvoice = useMemo(() => {
    if (params.invoiceId && params.amount) {
      return { id: String(params.invoiceId), amount: Number(params.amount) };
    }
    const first = invoices[0];
    return first ? { id: first.id, amount: first.amount } : null;
  }, [params.invoiceId, params.amount, invoices]);

  const startCheckout = async () => {
    try {
      if (!targetInvoice) {
        Alert.alert('Sem faturas', 'Não há faturas pendentes para pagar.');
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('invoices')
        .select('invoice_pdf_url')
        .eq('id', targetInvoice.id)
        .single();
      const url = (data as any)?.invoice_pdf_url ?? '';
      if (url) {
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        } else {
          await WebBrowser.openBrowserAsync(url);
        }
      } else {
        Alert.alert('Info', 'Sem checkout. Use Confirmar após o pagamento.');
      }
    } catch (e: any) {
      console.log('Checkout error', e);
      Alert.alert('Erro', e?.message ?? 'Não foi possível iniciar o checkout');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    try {
      if (!targetInvoice) return;
      setLoading(true);
      const { error } = await supabase.rpc('mark_invoice_paid', { invoice_id: targetInvoice.id, receipt: 'manual-confirmation' });
      if (error) throw error;
      Alert.alert('Pagamento', 'Pagamento confirmado com sucesso!');
      try { router.back(); } catch {}
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível confirmar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="pay-screen">
      <Stack.Screen options={{ title: 'Pagamento' }} />
      <View style={styles.card}>
        <View style={styles.header}>
          <CreditCard size={20} color={colors.primary} />
          <Text style={styles.title}>Pagar agora</Text>
        </View>
        <Text style={styles.caption}>
          {targetInvoice ? `Fatura #${targetInvoice.id} — €${targetInvoice.amount.toFixed(2)}` : 'Nenhuma fatura pendente.'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={startCheckout} activeOpacity={0.9} disabled={loading} testID="pay-now">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Abrir Checkout</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.success, marginTop: 10 }]} onPress={confirmPayment} activeOpacity={0.9} disabled={loading || !targetInvoice} testID="confirm-payment">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Já paguei — Confirmar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  button: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' as const },
});
