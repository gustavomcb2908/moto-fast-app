import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading, error, refetch } = trpc.rental.payments.history.useQuery({});
  const rows = (data?.data ?? []) as { id: string; amount: number; date: string; method: string; status: string }[];

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.error }} onPress={() => refetch()}>Falha ao carregar histórico. Toque para tentar novamente.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="history-screen">
      <Stack.Screen options={{ title: 'Histórico' }} />
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const ok = item.status === 'succeeded';
          return (
            <View style={styles.row}>
              <View style={styles.left}>
                <CreditCard size={20} color={colors.primary} />
                <View>
                  <Text style={styles.title}>Pagamento {item.id}</Text>
                  <Text style={styles.subtitle}>{new Date(item.date).toLocaleString('pt-PT')}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>€{item.amount.toFixed(2)}</Text>
                {ok ? (
                  <CheckCircle2 size={16} color={colors.success} />
                ) : (
                  <AlertTriangle size={16} color={colors.warning} />
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right: { alignItems: 'flex-end', gap: 6 },
  title: { fontSize: 14, color: colors.text, fontWeight: '700' as const },
  subtitle: { fontSize: 12, color: colors.textSecondary },
  amount: { fontSize: 14, color: colors.text, fontWeight: '700' as const },
});
