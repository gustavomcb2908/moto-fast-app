import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react-native';
import { Stack } from 'expo-router';

const data = [
  { id: 'tx_1', amount: 150.0, date: new Date().toISOString(), method: 'card', status: 'succeeded' },
  { id: 'tx_2', amount: 120.0, date: new Date(Date.now()-86400000).toISOString(), method: 'manual', status: 'pending' },
];

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container} testID="history-screen">
      <Stack.Screen options={{ title: 'Histórico' }} />
      <FlatList
        data={data}
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
