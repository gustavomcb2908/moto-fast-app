import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CreditCard } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';

export default function PayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState<boolean>(false);
  const params = useLocalSearchParams<{ invoiceId?: string; amount?: string }>();

  const invoicesQuery = trpc.rental.listInvoices.useQuery({}, { enabled: !params.invoiceId });
  const utils = trpc.useUtils();
  const intentMutation = trpc.rental.payments.intent.useMutation();
  const confirmMutation = trpc.rental.payments.confirm.useMutation();

  const targetInvoice = useMemo(() => {
    if (params.invoiceId && params.amount) {
      return { id: String(params.invoiceId), amount: Number(params.amount) };
    }
    const firstPending = (invoicesQuery.data?.data ?? []).find((i: any) => i.status === 'pending');
    return firstPending ? { id: String(firstPending.id), amount: Number(firstPending.amount) } : null;
  }, [params.invoiceId, params.amount, invoicesQuery.data]);

  const startCheckout = async () => {
    try {
      if (!targetInvoice) {
        Alert.alert('Sem faturas', 'Não há faturas pendentes para pagar.');
        return;
      }
      setLoading(true);
      const res = await intentMutation.mutateAsync({ invoiceId: targetInvoice.id, amount: targetInvoice.amount });
      const checkoutUrl = res?.data?.checkoutUrl ?? '';
      if (!checkoutUrl) throw new Error('Falha ao iniciar checkout');
      if (Platform.OS === 'web') {
        window.open(checkoutUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(checkoutUrl);
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
      await confirmMutation.mutateAsync({ invoiceId: targetInvoice.id });
      await utils.rental.listInvoices.invalidate();
      await utils.rental.payments.history.invalidate();
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
