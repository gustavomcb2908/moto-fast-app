import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { mockOrders } from '@/constants/mockData';
import { MapPin } from 'lucide-react-native';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão de localização negada');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);



  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Mapa',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }}
      />
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <View style={styles.webPlaceholder}>
            <MapPin size={64} color={Colors.textSecondary} />
            <Text style={styles.webText}>Visualização do Mapa</Text>
            <Text style={styles.webSubtext}>
              O mapa está disponível apenas no aplicativo móvel.
              Use o app no iOS ou Android para rastreamento em tempo real.
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
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <MapPin size={48} color={Colors.textSecondary} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Text style={styles.errorSubtext}>
              Ative a permissão de localização nas configurações
            </Text>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <MapPin size={48} color={Colors.textSecondary} />
            <Text style={styles.errorText}>Mapa Móvel</Text>
            <Text style={styles.errorSubtext}>
              O mapa com rastreamento está disponível no aplicativo móvel
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  webText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  webSubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  webStatNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  webStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

});
