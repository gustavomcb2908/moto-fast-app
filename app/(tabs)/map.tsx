import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { mockOrders, Order } from '@/constants/mockData';
import { MapPin } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { usePermissionManager } from '@/utils/permissions';
import { useTraccarDevices, TraccarDevice } from '@/services/traccarService';

type OrderWithCoordinates = Order & {
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

type DeviceWithCoords = Pick<TraccarDevice, 'id' | 'name' | 'status'> & {
  latitude: number;
  longitude: number;
  speed: number;
};

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { requestLocation } = usePermissionManager();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const webRef = useRef<WebView | null>(null);

  const activeOrders: OrderWithCoordinates[] = mockOrders
    .filter((o) => o.status !== 'completed')
    .map((order, index) => ({
      ...order,
      coordinates: {
        latitude: order.lat || (-8.8398 + index * 0.01),
        longitude: order.lng || (13.2894 + index * 0.01),
      },
    }));

  const traccarQuery = useTraccarDevices();
  const devices: DeviceWithCoords[] = useMemo(() => {
    const list = traccarQuery.data?.devices ?? [];
    const mapped = list
      .filter((d) => d.position != null)
      .map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        latitude: d.position?.latitude ?? 0,
        longitude: d.position?.longitude ?? 0,
        speed: d.position?.speed ?? 0,
      }));
    if ((traccarQuery.error as any)?.message) {
      console.log('❌ Traccar query error:', (traccarQuery.error as any).message);
    }
    console.log('🛰️ Traccar devices loaded:', {
      total: list.length,
      withPosition: mapped.length,
      isFetching: traccarQuery.isFetching,
      isRefetching: traccarQuery.isRefetching,
      status: traccarQuery.status,
    });
    return mapped;
  }, [traccarQuery.data, traccarQuery.error, traccarQuery.isFetching, traccarQuery.isRefetching, traccarQuery.status]);

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
        console.log('Erro ao obter localização:', error);
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
          <Text style={styles.errorSubtext}>Ative a permissão de localização nas configurações</Text>
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

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css"/>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
          .marker-active { filter: drop-shadow(0 2px 6px rgba(0,0,0,.3)); }
          .leaflet-routing-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            padding: 12px;
            max-width: 90%;
          }
          .leaflet-routing-alt {
            background: #27AE60;
            color: white;
            border-radius: 6px;
            padding: 8px 12px;
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const userLat = ${location.coords.latitude};
          const userLng = ${location.coords.longitude};
          const orders = ${JSON.stringify(activeOrders.map(o => ({ 
            id: o.id, 
            clientName: o.clientName,
            address: o.address,
            status: o.status,
            value: o.value,
            lat: o.coordinates.latitude, 
            lng: o.coordinates.longitude 
          })))};
          const devices = ${JSON.stringify(devices)};
          const map = L.map('map').setView([userLat, userLng], 13);
          L.tileLayer('${tileUrl}', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
          
          const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #27AE60; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 18px;">📍</span></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const you = L.marker([userLat, userLng], { icon: userIcon, title: 'Você' }).addTo(map);
          you.bindPopup('<strong style="color: #27AE60;">Você está aqui</strong>');
          
          let currentRouting = null;
          
          // Render orders (demo)
          orders.forEach(o => {
            let statusColor = '#27AE60';
            let statusEmoji = '📦';
            if (o.status === 'pending') {
              statusColor = '#F2C94C';
              statusEmoji = '⏳';
            } else if (o.status === 'in_progress') {
              statusColor = '#2F80ED';
              statusEmoji = '🚀';
            } else if (o.status === 'accepted') {
              statusColor = '#27AE60';
              statusEmoji = '✅';
            }

            const orderIcon = L.divIcon({
              className: 'order-marker',
              html: '<div style="background: ' + statusColor + '; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><span style="font-size: 20px;">' + statusEmoji + '</span></div>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });
            
            const m = L.marker([o.lat, o.lng], { icon: orderIcon, title: 'Pedido ' + o.id }).addTo(map);
            
            const popupContent = '<div style="min-width: 200px;">' +
              '<strong style="color: #27AE60; font-size: 16px;">Pedido #' + o.id + '</strong><br>' +
              '<strong>Cliente:</strong> ' + o.clientName + '<br>' +
              '<strong>Endereço:</strong> ' + o.address + '<br>' +
              '<strong>Valor:</strong> €' + o.value.toFixed(2) + '<br>' +
              '<button onclick="createRoute(' + o.lat + ', ' + o.lng + ')" style="background: linear-gradient(135deg, #27AE60, #1F8E4D); color: white; border: none; padding: 10px 16px; border-radius: 8px; margin-top: 8px; cursor: pointer; font-weight: 600; width: 100%;">Ver Rota</button>' +
              '</div>';
            
            m.bindPopup(popupContent);
          });

          // Render Traccar devices
          const motoIcon = (active) => L.divIcon({
            className: 'moto-marker',
            html: '<div style="background:' + (active ? '#1F8E4D' : '#6B7280') + '; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="font-size: 16px;">🏍️</span></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const bounds = [];
          devices.forEach(d => {
            const isOnline = (d.status || '').toLowerCase() === 'online' || (d.speed ?? 0) > 0;
            const marker = L.marker([d.latitude, d.longitude], { icon: motoIcon(isOnline), title: d.name }).addTo(map);
            const distKm = (map.distance([userLat, userLng], [d.latitude, d.longitude]) / 1000).toFixed(1);
            const popup = '<div style="min-width: 200px;">' +
              '<strong style="color:#1F8E4D">' + d.name.replace(/</g,'&lt;') + '</strong><br/>' +
              '<span>Status: ' + (isOnline ? 'Disponível' : 'Ocupado/Offline') + '</span><br/>' +
              '<span>Velocidade: ' + (d.speed ?? 0) + ' km/h</span><br/>' +
              '<span>Distância: ' + distKm + ' km</span><br/>' +
              '<button onclick="createRoute(' + d.latitude + ',' + d.longitude + ')" style="background: linear-gradient(135deg, #27AE60, #1F8E4D); color: white; border: none; padding: 10px 16px; border-radius: 8px; margin-top: 8px; cursor: pointer; font-weight: 600; width: 100%;">Rota até aqui</button>' +
            '</div>';
            marker.bindPopup(popup);
            bounds.push([d.latitude, d.longitude]);
          });

          if (bounds.length) {
            bounds.push([userLat, userLng]);
            map.fitBounds(bounds, { padding: [40, 40] });
          }

          window.createRoute = function(destLat, destLng) {
            if (currentRouting) {
              map.removeControl(currentRouting);
            }
            
            currentRouting = L.Routing.control({
              waypoints: [
                L.latLng(userLat, userLng),
                L.latLng(destLat, destLng)
              ],
              routeWhileDragging: false,
              addWaypoints: false,
              lineOptions: {
                styles: [{
                  color: '#27AE60',
                  opacity: 0.8,
                  weight: 6
                }]
              },
              createMarker: function() { return null; },
              show: true,
              collapsible: true
            }).addTo(map);
          };
          
          true;
        </script>
      </body>
    </html>
  `;

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
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          source={{ html: leafletHTML }}
          style={{ flex: 1 }}
          testID="leaflet-webview"
        />
        <View style={styles.statsOverlay}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{devices.length}</Text>
            <Text style={styles.statLabel}>Motos disponíveis</Text>
          </View>
          {traccarQuery.isLoading ? (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Carregando motos...</Text>
            </View>
          ) : null}
          {traccarQuery.error ? (
            <View style={styles.statCard}>
              <Text style={[styles.statLabel, { color: '#ef4444' }]}>Erro ao carregar motos</Text>
            </View>
          ) : null}
          {!traccarQuery.error && !traccarQuery.isLoading && devices.length === 0 ? (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Nenhuma moto com posição</Text>
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { fontSize: 16, fontWeight: '600' as const, color: colors.text, marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.background },
  errorText: { fontSize: 18, fontWeight: '600' as const, color: colors.text, marginTop: 16, textAlign: 'center' },
  errorSubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  statsOverlay: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', gap: 12 },
  statCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statNumber: { fontSize: 24, fontWeight: '700' as const, color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
