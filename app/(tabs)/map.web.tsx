import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useTraccarDevices, TraccarDevice } from '@/services/traccarService';

type DeviceWithCoords = Pick<TraccarDevice, 'id' | 'name' | 'status'> & {
  latitude: number;
  longitude: number;
  speed: number;
};

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const webRef = useRef<WebView | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de localização negada');
          return;
        }
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        console.error('Erro ao obter localização na web:', error);
        setErrorMsg('Erro ao obter localização. Tente novamente.');
      }
    })();
  }, []);

  const traccarQuery = useTraccarDevices();
  const devices: DeviceWithCoords[] = useMemo(() => {
    const list = traccarQuery.data?.devices ?? [];
    return list
      .filter((d) => d.position != null)
      .map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        latitude: d.position?.latitude ?? 0,
        longitude: d.position?.longitude ?? 0,
        speed: d.position?.speed ?? 0,
      }));
  }, [traccarQuery.data]);

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
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const userLat = ${location.coords.latitude};
          const userLng = ${location.coords.longitude};
          const devices = ${JSON.stringify(devices)};
          const map = L.map('map').setView([userLat, userLng], 13);
          L.tileLayer('${tileUrl}', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
          const userIcon = L.divIcon({ className: 'user-marker', html: '<div style="background:#27AE60;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;"><span style="color:white">📍</span></div>', iconSize: [28,28], iconAnchor:[14,14]});
          L.marker([userLat, userLng], { icon: userIcon }).addTo(map);

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
            const popup = '<div style="min-width:200px"><strong style="color:#1F8E4D">' + d.name.replace(/</g,'&lt;') + '</strong><br/>' +
              '<span>Status: ' + (isOnline ? 'Disponível' : 'Ocupado/Offline') + '</span><br/>' +
              '<span>Velocidade: ' + (d.speed ?? 0) + ' km/h</span><br/>' +
              '<span>Distância: ' + distKm + ' km</span></div>';
            marker.bindPopup(popup);
            bounds.push([d.latitude, d.longitude]);
          });
          if (bounds.length) { bounds.push([userLat, userLng]); map.fitBounds(bounds, { padding: [40, 40] }); }
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
