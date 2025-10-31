import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CreditCard } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Stack } from 'expo-router';

export default function PayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState<boolean>(false);

  const startCheckout = async () => {
    try {
      setLoading(true);
      const checkoutUrl = 'https://buy.stripe.com/test_00g4iK0Eo4Eo8wM9AA';
      if (Platform.OS === 'web') {
        window.open(checkoutUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(checkoutUrl);
      }
    } catch (e) {
      console.log('Checkout error', e);
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
        <Text style={styles.caption}>Abriremos o checkout seguro do Stripe.</Text>
        <TouchableOpacity style={styles.button} onPress={startCheckout} activeOpacity={0.9} disabled={loading} testID="pay-now">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Abrir Checkout</Text>}
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
