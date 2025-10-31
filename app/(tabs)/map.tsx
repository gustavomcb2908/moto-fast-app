import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { mockOrders } from '@/constants/mockData';
import { Navigation, MapPin } from 'lucide-react-native';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const MapComponents = require('react-native-maps');
  MapView = MapComponents.default;
  Marker = MapComponents.Marker;
  PROVIDER_GOOGLE = MapComponents.PROVIDER_GOOGLE;
}

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

  const defaultRegion = {
    latitude: 38.7223,
    longitude: -9.1393,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const region = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : defaultRegion;

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
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <MapPin size={48} color={Colors.textSecondary} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Text style={styles.errorSubtext}>
              Ative a permissão de localização nas configurações
            </Text>
          </View>
        ) : Platform.OS === 'web' ? (
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
        ) : (
          <>
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={region}
              region={region}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass
            >
              {mockOrders
                .filter((order) => order.status !== 'completed')
                .map((order) => (
                  <Marker
                    key={order.id}
                    coordinate={{
                      latitude: order.lat,
                      longitude: order.lng,
                    }}
                    title={order.clientName}
                    description={order.address}
                  />
                ))}
            </MapView>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.locationButton}>
                <Navigation size={24} color={Colors.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoDot} />
                <Text style={styles.infoText}>
                  {mockOrders.filter((o) => o.status !== 'completed').length} entregas ativas
                </Text>
              </View>
              <Text style={styles.infoSubtext}>
                Toque nos marcadores para ver detalhes
              </Text>
            </View>
          </>
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
  map: {
    flex: 1,
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
  controls: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 12,
  },
  locationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  infoSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
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
});
