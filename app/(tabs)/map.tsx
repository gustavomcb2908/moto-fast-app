import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { mockOrders, Order } from '@/constants/mockData';
import { MapPin } from 'lucide-react-native';

type OrderWithCoordinates = Order & {
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

import { usePermissionManager } from '@/utils/permissions';

export default function MapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { requestLocation } = usePermissionManager();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeOrders: OrderWithCoordinates[] = mockOrders
    .filter((o) => o.status !== 'completed')
    .map((order, index) => ({
      ...order,
      coordinates: {
        latitude: order.lat || (-8.8398 + (index * 0.01)),
        longitude: order.lng || (13.2894 + (index * 0.01)),
      },
    }));

  useEffect(() => {
    (async () => {
      try {
        const perm = await requestLocation();
        if (!perm.granted) {
          setErrorMsg('Permissão de localização negada');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
      } catch (error) {
        console.error('Erro ao obter localização:', error);
        setErrorMsg('Erro ao obter localização. Tente novamente.');
      }
    })();
  }, [requestLocation]);

  if (errorMsg) {
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
        <View style={styles.errorContainer}>
          <MapPin size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Text style={styles.errorSubtext}>
            Ative a permissão de localização nas configurações
          </Text>
        </View>
      </>
    );
  }

  if (!location) {
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
        <View style={styles.loadingContainer}>
          <MapPin size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Obtendo localização...</Text>
        </View>
      </>
    );
  }

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
        <View style={styles.placeholderContainer}>
          <MapPin size={64} color={colors.textSecondary} />
          <Text style={styles.placeholderText}>
            {Platform.OS === 'web' 
              ? 'Mapa disponível apenas em dispositivos móveis'
              : 'Carregando mapa...'}
          </Text>
        </View>

        <View style={styles.statsOverlay}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Entregas Ativas</Text>
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
