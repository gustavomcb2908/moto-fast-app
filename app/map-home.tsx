import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTraccarDevices } from '@/services/traccarService';
import { supabase } from '@/lib/supabaseClient';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';
import { MapPin, Bike, Info, Navigation, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type VehicleRow = {
  id: string;
  plate: string | null;
  model: string | null;
  rental_status: string | null;
  monthly_fee: number | null;
  traccar_device_id?: number | null;
};

type MappedDevice = {
  deviceId: number;
  name: string;
  plate: string | null;
  model: string | null;
  monthlyFee: number;
  vehicleId: string | null;
  latitude: number;
  longitude: number;
  distance?: number;
};

export default function MapHomeScreen() {
  const insets = useSafeAreaInsets();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [selectedDevice, setSelectedDevice] = useState<MappedDevice | null>(null);
  const [vehiclesDb, setVehiclesDb] = useState<VehicleRow[]>([]);
  const [showMotos, setShowMotos] = useState(false);

  const { data: traccarData, isLoading } = useTraccarDevices();
  const webRef = useRef<WebView | null>(null);
  const bottomSheetAnim = useRef(new Animated.Value(-400)).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermission('granted');
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } else {
          setLocationPermission('denied');
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, plate, model, rental_status, monthly_fee, traccar_device_id')
          .neq('rental_status', 'rented');
        if (!error) setVehiclesDb((data as unknown as VehicleRow[]) ?? []);
      } catch (e) {
        console.log('vehicles load error', e);
      }
    })();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const mappedDevices = useMemo<MappedDevice[]>(() => {
    const devices = traccarData?.devices ?? [];
    return devices
      .filter((d: any) => d.position)
      .map((d: any) => {
        const match = vehiclesDb.find(
          (v) => (v.traccar_device_id && v.traccar_device_id === d.id) || (v.plate && d.name?.includes(v.plate))
        );
        let distance: number | undefined;
        if (userLocation && d.position) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            d.position.latitude,
            d.position.longitude
          );
        }
        return {
          deviceId: d.id,
          name: d.name,
          plate: match?.plate ?? null,
          model: match?.model ?? null,
          monthlyFee: Number(match?.monthly_fee ?? 0),
          vehicleId: match?.id ?? null,
          latitude: d.position.latitude,
          longitude: d.position.longitude,
          distance,
        };
      })
      .filter((m: MappedDevice) => !!m.vehicleId);
  }, [traccarData?.devices, vehiclesDb, userLocation]);

  const leafletHTML = useMemo(() => {
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const markers = mappedDevices.map((m) => ({
      id: m.deviceId,
      lat: m.latitude,
      lng: m.longitude,
      name: m.name,
      plate: m.plate,
    }));
    
    const centerLat = userLocation?.latitude ?? markers[0]?.lat ?? 38.736946;
    const centerLng = userLocation?.longitude ?? markers[0]?.lng ?? -9.142685;
    
    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; background: #0c0c0c; }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(50, 215, 75, 0.6); }
        70% { box-shadow: 0 0 0 14px rgba(50, 215, 75, 0); }
        100% { box-shadow: 0 0 0 0 rgba(50, 215, 75, 0); }
      }
      .moto-marker {
        background: #32d74b;
        border: 3px solid #1F8E4D;
        border-radius: 9999px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(50, 215, 75, 0.4);
        cursor: pointer;
        transition: transform 0.2s;
        animation: pulse 2.2s ease-out infinite;
      }
      .moto-marker:hover {
        transform: scale(1.05);
      }
      .user-marker {
        background: #2F80ED;
        border: 3px solid #1F5BA8;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 0 0 8px rgba(47, 128, 237, 0.2);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const markers = ${JSON.stringify(markers)};
      const userLoc = ${userLocation ? JSON.stringify(userLocation) : 'null'};
      const map = L.map('map').setView([${centerLat}, ${centerLng}], ${userLocation ? 14 : 12});
      
      L.tileLayer('${tileUrl}', { 
        maxZoom: 19, 
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      
      function onSelect(id) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(String(id));
        }
      }
      
      if (userLoc) {
        const userIcon = L.divIcon({
          className: 'user-marker',
          iconSize: [20, 20],
        });
        L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Sua localização</b>');
      }
      
      markers.forEach(m => {
        const motoIcon = L.divIcon({
          className: 'moto-marker',
          html: '<div style="color: black; font-size: 18px;">🛵</div>',
          iconSize: [40, 40],
        });
        
        const marker = L.marker([m.lat, m.lng], { icon: motoIcon })
          .addTo(map);
        
        marker.bindPopup('<b>' + (m.model || m.plate || m.name) + '</b><br/>Toque para ver detalhes');
        marker.on('click', () => onSelect(m.id));
      });
      
      true;
    </script>
  </body>
</html>`;
  }, [mappedDevices, userLocation]);

  const onMapMessage = useCallback(
    async (ev: any) => {
      const id = Number(ev?.nativeEvent?.data ?? NaN);
      if (!Number.isFinite(id)) return;
      const target = mappedDevices.find((m) => m.deviceId === id) ?? null;
      setSelectedDevice(target);
      
      if (target) {
        try { if (Platform.OS !== 'web') { await Haptics.selectionAsync(); } } catch {}
        Animated.spring(bottomSheetAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
    },
    [mappedDevices, bottomSheetAnim]
  );

  const closeBottomSheet = useCallback(() => {
    Animated.timing(bottomSheetAnim, {
      toValue: -400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSelectedDevice(null));
  }, [bottomSheetAnim]);

  const handleRentMotorcycle = () => {
    closeBottomSheet();
    router.push('/onboarding');
  };

  const handleOwnMotorcycle = () => {
    try { if (Platform.OS !== 'web') { Haptics.selectionAsync(); } } catch {}
    router.push('/onboarding');
  };

  const recenterMap = () => {
    if (userLocation && webRef.current) {
      webRef.current.injectJavaScript(`
        map.setView([${userLocation.latitude}, ${userLocation.longitude}], 14);
        true;
      `);
    }
  };

  const handleShowMotos = () => {
    setShowMotos(true);
  };

  if (locationPermission === 'undetermined' || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando motos disponíveis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.webPlaceholder}>
          <MapPin size={64} color={Colors.primary} />
          <Text style={styles.webPlaceholderTitle}>Mapa Interativo</Text>
          <Text style={styles.webPlaceholderText}>
            Abra este app no seu dispositivo móvel para visualizar as motos disponíveis no mapa.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleOwnMotorcycle}>
            <Text style={styles.ctaButtonText}>Começar Cadastro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {locationPermission === 'denied' && !showMotos ? (
            <View style={styles.permissionDenied}>
              <LinearGradient
                colors={[Colors.gradient.start, Colors.gradient.end]}
                style={styles.permissionCard}
              >
                <MapPin size={48} color={Colors.surface} />
                <Text style={styles.permissionTitle}>Localização não disponível</Text>
                <Text style={styles.permissionText}>
                  Precisamos da sua localização para mostrar as motos próximas.
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={handleShowMotos}>
                  <Text style={styles.permissionButtonText}>Mostrar Motos Disponíveis</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <WebView
              ref={webRef}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              onMessage={onMapMessage}
              source={{ html: leafletHTML }}
              style={styles.map}
              testID="home-map"
            />
          )}

          <View style={[styles.header, { paddingTop: insets.top }]}>
            <LinearGradient
              colors={[Colors.gradient.start + 'EE', Colors.gradient.end + 'EE']}
              style={styles.headerGradient}
            >
              <Text style={styles.headerTitle}>Moto Fast</Text>
              <Text style={styles.headerSubtitle}>Escolha sua moto</Text>
            </LinearGradient>
          </View>

          <View style={[styles.actions, { top: 160 + insets.top }]}>
            {userLocation && (
              <TouchableOpacity
                style={styles.floatingButton}
                onPress={recenterMap}
                activeOpacity={0.8}
              >
                <Navigation size={24} color={Colors.surface} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.floatingButton, { marginTop: 12 }]}
              onPress={() => router.push('/welcome')}
              activeOpacity={0.8}
            >
              <Info size={24} color={Colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { paddingBottom: 40 + insets.bottom }]} accessibilityLabel="footer-cta">
            <TouchableOpacity
              style={styles.ownMotorcycleButton}
              onPress={handleOwnMotorcycle}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="ja-tenho-moto"
            >
              <View style={styles.ownMotorcyclePill}>
                <Bike size={22} color={Colors.background} />
                <Text style={styles.ownMotorcycleTextDark}>Já tenho moto</Text>
              </View>
            </TouchableOpacity>
          </View>

          {selectedDevice && (
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: bottomSheetAnim }],
                },
              ]}
            >
              <View style={styles.bottomSheetHandle} />
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeBottomSheet}
                activeOpacity={0.7}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.bottomSheetContent}>
                <View style={styles.bikeIconContainer}>
                  <LinearGradient
                    colors={[Colors.gradient.start, Colors.gradient.end]}
                    style={styles.bikeIconGradient}
                  >
                    <Bike size={32} color={Colors.surface} />
                  </LinearGradient>
                </View>

                <Text style={styles.bottomSheetTitle}>
                  {selectedDevice.model || selectedDevice.name}
                </Text>
                
                {selectedDevice.plate && (
                  <Text style={styles.bottomSheetPlate}>Matrícula: {selectedDevice.plate}</Text>
                )}

                {selectedDevice.distance && (
                  <View style={styles.distanceContainer}>
                    <MapPin size={16} color={Colors.primary} />
                    <Text style={styles.distanceText}>
                      {selectedDevice.distance < 1
                        ? `${Math.round(selectedDevice.distance * 1000)}m de distância`
                        : `${selectedDevice.distance.toFixed(1)}km de distância`}
                    </Text>
                  </View>
                )}

                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Valor da locação</Text>
                  <Text style={styles.priceValue}>€{selectedDevice.monthlyFee.toFixed(2)}/mês</Text>
                </View>

                <TouchableOpacity
                  style={styles.rentButton}
                  onPress={handleRentMotorcycle}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[Colors.gradient.start, Colors.gradient.end]}
                    style={styles.rentButtonGradient}
                  >
                    <Text style={styles.rentButtonText}>Alugar esta moto</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  map: {
    flex: 1,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 20,
  },
  webPlaceholderTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  webPlaceholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    maxWidth: 400,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.surface,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.surface,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  permissionButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerGradient: {
    padding: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.surface,
    opacity: 0.9,
  },
  actions: {
    position: 'absolute',
    right: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  ownMotorcycleButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  ownMotorcyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
  },
  ownMotorcycleTextDark: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#000000',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomSheetContent: {
    padding: 24,
    gap: 16,
  },
  bikeIconContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  bikeIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  bottomSheetPlate: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  priceContainer: {
    backgroundColor: Colors.backgroundAlt,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  rentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  rentButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  rentButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
