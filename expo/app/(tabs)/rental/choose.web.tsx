import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin } from 'lucide-react-native';

export default function RentMotorcycleScreenWeb() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Escolher Moto', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
      <View style={styles.placeholder}>
        <MapPin size={64} color={colors.textSecondary} />
        <Text style={styles.title}>Mapa de locação</Text>
        <Text style={styles.subtitle}>Abra no dispositivo para ver o mapa interativo e selecionar a moto.</Text>
        <TouchableOpacity style={styles.cta} disabled>
          <Text style={styles.ctaText}>Carregar motos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' as const, marginTop: 20 },
  subtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
  cta: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '700' as const },
});
