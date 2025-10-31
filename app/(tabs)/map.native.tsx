import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Colors from '@/constants/colors';
import { mockOrders, Order } from '@/constants/mockData';
import { MapPin, Navigation, RefreshCw } from 'lucide-react-native';

type OrderWithCoordinates = Order & {
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const mapRef = useRef<MapView>(null);

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão de localização negada');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
    })();
  }, []);

  const handleCenterOnUser = async () => {
    if (!location && !errorMsg) {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
    }

    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const handleRefreshLocation = async () => {
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setLocation(currentLocation);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  if (errorMsg) {
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
        <View style={styles.errorContainer}>
          <MapPin size={48} color={Colors.textSecondary} />
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
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <MapPin size={48} color={Colors.primary} />
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
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }}
      />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          followsUserLocation={isTracking}
        >
          {activeOrders.map((order) => (
            <Marker
              key={order.id}
              coordinate={order.coordinates}
              title={order.clientName}
              description={order.address}
              pinColor={Colors.primary}
            />
          ))}

          {activeOrders.length > 0 && activeOrders[0].coordinates && (
            <Polyline
              coordinates={[
                {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
                activeOrders[0].coordinates,
              ]}
              strokeColor={Colors.primary}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        <View style={styles.statsOverlay}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Entregas Ativas</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRefreshLocation}
          >
            <RefreshCw size={24} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              isTracking && styles.controlButtonActive,
            ]}
            onPress={toggleTracking}
          >
            <Navigation
              size={24}
              color={isTracking ? Colors.primary : Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleCenterOnUser}
          >
            <MapPin size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {activeOrders.length > 0 && (
          <View style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
              <Text style={styles.orderCardTitle}>Próxima Entrega</Text>
              <View style={[styles.badge, styles.badgePending]}>
                <Text style={styles.badgeText}>{activeOrders[0].status}</Text>
              </View>
            </View>
            <Text style={styles.orderCustomer}>{activeOrders[0].clientName}</Text>
            <Text style={styles.orderAddress}>{activeOrders[0].address}</Text>
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
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
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
  statsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surface,
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
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  controls: {
    position: 'absolute',
    right: 16,
    top: '40%',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: '#D1FAE5',
  },
  orderCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  orderCustomer: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#92400E',
    textTransform: 'capitalize',
  },
});
