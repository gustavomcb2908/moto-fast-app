import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FileText, CheckCircle2, AlertTriangle, Clock, ChevronRight } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function InvoicesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading, error, refetch } = trpc.rental.listInvoices.useQuery({});

  const invoices = (data?.data ?? []) as { id: string; amount: number; dueDate: string; status: string }[];

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 16 }]}>
        <Text style={{ color: colors.error, marginBottom: 12 }}>Falha ao carregar faturas</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700' as const }}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="invoices-screen">
      <Stack.Screen options={{ title: 'Faturas' }} />
      <FlatList
        data={invoices}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const status = (item.status ?? 'pending') as 'paid' | 'pending' | 'overdue';
          const chip = {
            paid: { color: colors.success, label: 'Pago', Icon: CheckCircle2 },
            pending: { color: colors.warning, label: 'Pendente', Icon: Clock },
            overdue: { color: colors.error, label: 'Atrasado', Icon: AlertTriangle },
          }[status];
          const ChipIcon = chip.Icon;
          const goToPay = () => router.push({ pathname: '/(tabs)/rental/pay', params: { invoiceId: item.id, amount: String(item.amount) } });
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={status !== 'paid' ? goToPay : undefined} testID={`invoice-${item.id}`}>
              <View style={styles.iconWrap}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Fatura #{item.id}</Text>
                <Text style={styles.subtitle}>Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-PT')}</Text>
                <View style={[styles.chip, { backgroundColor: chip.color + '15' }]}>
                  <ChipIcon size={14} color={chip.color} />
                  <Text style={[styles.chipText, { color: chip.color }]}>{chip.label}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>€{item.amount.toFixed(2)}</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginTop: 6, alignSelf: 'flex-start' },
  chipText: { fontSize: 11, fontWeight: '600' as const },
});
