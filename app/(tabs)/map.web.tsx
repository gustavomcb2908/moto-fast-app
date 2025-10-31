import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { mockOrders } from '@/constants/mockData';
import { MapPin } from 'lucide-react-native';

export default function MapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permissão de localização negada na web');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        console.error('Erro ao obter localização na web:', error);
      }
    })();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Mapa',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <View style={styles.webPlaceholder}>
          <MapPin size={64} color={colors.textSecondary} />
          <Text style={styles.webText}>Mapa (OpenStreetMap)</Text>
          <Text style={styles.webSubtext}>
            Para a experiência completa com Leaflet + OpenStreetMap, use o app no iOS ou Android.
            Nesta pré-visualização web, o mapa interativo não é renderizado.
          </Text>
          <View style={styles.webStats}>
            <View style={styles.webStatCard}>
              <Text style={styles.webStatNumber}>
                {mockOrders.filter((o) => o.status !== 'completed').length}
              </Text>
              <Text style={styles.webStatLabel}>Entregas Ativas</Text>
            </View>
            <View style={styles.webStatCard}>
              <Text style={styles.webStatNumber}>
                {location ? '📍 Localizado' : '⏳ Carregando'}
              </Text>
              <Text style={styles.webStatLabel}>Status</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  webText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  webSubtext: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  webStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  webStatCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  webStatNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  webStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
