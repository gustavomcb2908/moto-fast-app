import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTraccarDevices } from '@/services/traccarService';
import { WebView } from 'react-native-webview';
import { MapPin, Bike, X, CheckCircle2, RefreshCw } from 'lucide-react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { createRental } from '@/services/rentalService';
import { LinearGradient } from 'expo-linear-gradient';

interface VehicleRow {
  id: string;
  plate: string | null;
  model: string | null;
  rental_status: string | null;
  monthly_fee: number | null;
  traccar_device_id?: number | null;
}

interface MappedDevice {
  deviceId: number;
  name: string;
  plate: string | null;
  model: string | null;
  monthlyFee: number;
  vehicleId: string | null;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

export default function RentMotorcycleScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const webRef = useRef<WebView | null>(null);
  const { data, isLoading, refetch, error } = useTraccarDevices();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [selected, setSelected] = useState<MappedDevice | null>(null);
  const [loc, setLoc] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [showBikesWithoutLocation, setShowBikesWithoutLocation] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        console.log('🗺️ Solicitando permissão de localização...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          console.log('✅ Permissão concedida, obtendo localização atual...');
          const l = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.High
          });
          console.log('📍 Localização obtida:', l.coords.latitude, l.coords.longitude);
          setLoc(l);
          setLocationPermission('granted');
        } else {
          console.log('❌ Permissão de localização negada');
          setLocationPermission('denied');
        }
      } catch (e) {
        console.error('❌ Erro ao obter localização:', e);
        setLocationPermission('denied');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: rows, error: vErr } = await supabase
          .from('vehicles')
          .select('id, plate, model, rental_status, monthly_fee, traccar_device_id')
          .neq('rental_status', 'rented');
        if (vErr) throw vErr;
        setVehicles((rows as unknown as VehicleRow[]) ?? []);
      } catch (e) {
        console.error('Failed to load vehicles table', e);
      }
    })();
  }, []);

  const mapped = useMemo<MappedDevice[]>(() => {
    const devices = data?.devices ?? [];
    return devices
      .filter((d) => d.position)
      .map((d) => {
        const match = vehicles.find(
          (v) => (v.traccar_device_id && v.traccar_device_id === d.id) || (v.plate && d.name?.includes(v.plate))
        );
        const lat = d.position!.latitude;
        const lng = d.position!.longitude;
        let distanceKm: number | undefined = undefined;
        if (loc) {
          const R = 6371;
          const dLat = ((lat - loc.coords.latitude) * Math.PI) / 180;
          const dLng = ((lng - loc.coords.longitude) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc.coords.latitude * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = R * c;
        }
        return {
          deviceId: d.id,
          name: d.name,
          plate: match?.plate ?? null,
          model: match?.model ?? null,
          monthlyFee: Number(match?.monthly_fee ?? 0),
          vehicleId: match?.id ?? null,
          latitude: lat,
          longitude: lng,
          distanceKm,
        };
      })
      .filter((m) => !!m.vehicleId);
  }, [data?.devices, vehicles, loc]);

  const leafletHTML = useMemo(() => {
    console.log('🗺️ Gerando HTML do mapa com', mapped.length, 'motos');
    console.log('📍 Localização do usuário:', loc?.coords);
    
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    const markers = mapped.map((m) => ({ 
      id: m.deviceId, 
      lat: m.latitude, 
      lng: m.longitude, 
      name: m.name, 
      plate: m.plate,
      model: m.model 
    }));
    
    console.log('🏍️ Marcadores das motos:', markers);
    
    const hasUserLocation = loc?.coords?.latitude && loc?.coords?.longitude;
    const centerLat = hasUserLocation ? loc.coords.latitude : (markers[0]?.lat ?? 38.736946);
    const centerLng = hasUserLocation ? loc.coords.longitude : (markers[0]?.lng ?? -9.142685);
    const initialZoom = hasUserLocation ? 15 : (markers.length > 0 ? 13 : 12);

    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .bike-marker {
        background: #27AE60;
        border: 3px solid #fff;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 20px;
      }
      .user-marker {
        background: linear-gradient(135deg, #27AE60 0%, #1F8E4D 100%);
        border: 4px solid #fff;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 0 0 4px rgba(39, 174, 96, 0.3), 0 4px 12px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(39, 174, 96, 0.3), 0 4px 12px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 0 0 8px rgba(39, 174, 96, 0.1), 0 4px 12px rgba(0,0,0,0.3); }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      console.log('🗺️ Inicializando mapa Leaflet...');
      const markers = ${JSON.stringify(markers)};
      const userLat = ${JSON.stringify(loc?.coords?.latitude ?? null)};
      const userLng = ${JSON.stringify(loc?.coords?.longitude ?? null)};
      
      console.log('📍 Motos no mapa:', markers.length);
      console.log('👤 Localização do usuário:', userLat, userLng);
      
      const map = L.map('map').setView([${centerLat}, ${centerLng}], ${initialZoom});
      L.tileLayer('${tileUrl}', { 
        maxZoom: 19, 
        attribution: '&copy; OpenStreetMap contributors' 
      }).addTo(map);
      
      function onSelect(id){
        console.log('🏍️ Moto selecionada:', id);
        if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){
          window.ReactNativeWebView.postMessage(String(id));
        }
      }

      const bikeIcon = L.divIcon({
        className: 'bike-marker',
        html: '🏍️',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });

      const bounds = [];
      markers.forEach(m => {
        console.log('🏍️ Adicionando marcador:', m.plate || m.name, 'em', m.lat, m.lng);
        const marker = L.marker([m.lat, m.lng], { 
          icon: bikeIcon,
          title: m.name 
        }).addTo(map);
        
        const popupContent = '<div style="text-align:center;padding:8px;">' +
          '<b style="font-size:14px;">' + (m.model || m.name) + '</b><br/>' +
          '<span style="font-size:12px;color:#666;">' + (m.plate || '—') + '</span><br/>' +
          '<button onclick="window.ReactNativeWebView.postMessage(' + m.id + ')" style="margin-top:8px;background:#27AE60;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Selecionar</button>' +
          '</div>';
        
        marker.bindPopup(popupContent);
        marker.on('click', () => onSelect(m.id));
        bounds.push([m.lat, m.lng]);
      });

      if (userLat && userLng) {
        console.log('📍 Adicionando marcador do usuário');
        const userIcon = L.divIcon({
          className: 'user-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
        bounds.push([userLat, userLng]);
        
        if (bounds.length > 1) {
          console.log('🗺️ Ajustando mapa para mostrar usuário e motos');
          const b = L.latLngBounds(bounds);
          map.fitBounds(b, { padding: [50, 50], maxZoom: 15 });
        } else {
          map.setView([userLat, userLng], 15);
        }
      } else if (markers.length > 0) {
        console.log('🗺️ Ajustando mapa para mostrar apenas motos');
        if (bounds.length > 1) {
          const b = L.latLngBounds(bounds);
          map.fitBounds(b, { padding: [50, 50] });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 14);
        }
      }
      
      console.log('✅ Mapa inicializado com sucesso');
    </script>
  </body>
</html>`;
  }, [isDark, mapped, loc]);

  const onMessage = useCallback((ev: any) => {
    const id = Number(ev?.nativeEvent?.data ?? NaN);
    if (!Number.isFinite(id)) return;
    const target = mapped.find((m) => m.deviceId === id) ?? null;
    setSelected(target);
  }, [mapped]);

  const handleConfirm = useCallback(async () => {
    try {
      if (!selected?.vehicleId) return;
      if (!user?.id) {
        Alert.alert('Sessão inválida', 'Inicie sessão para continuar.');
        return;
      }
      setLoadingAction(true);
      const { data: courierRow, error: cErr } = await supabase
        .from('couriers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (cErr) throw cErr;
      const courierId = (courierRow as any)?.id as string | undefined;
      if (!courierId) throw new Error('Courier não encontrado.');

      await createRental({
        courierId,
        vehicleId: selected.vehicleId,
        totalAmount: selected.monthlyFee || 0,
        paymentId: 'pi_demo',
      });

      setSelected(null);
      Alert.alert('Locação confirmada', 'Contrato criado com sucesso.');
    } catch (e: any) {
      console.error('Confirm rental error', e);
      Alert.alert('Erro', e?.message || 'Falha ao confirmar locação');
    } finally {
      setLoadingAction(false);
    }
  }, [selected, user?.id]);

  if (isLoading || locationPermission === 'pending') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {locationPermission === 'pending' ? 'Obtendo sua localização...' : 'Carregando motos disponíveis...'}
        </Text>
      </View>
    );
  }

  if (locationPermission === 'denied' && !showBikesWithoutLocation) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{
          headerShown: true,
          title: 'Escolher Moto',
          headerTintColor: '#fff',
          headerBackground: () => (
            <LinearGradient colors={[colors.primary, '#1F8E4D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          ),
        }} />
        <MapPin size={64} color={colors.textSecondary} />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>Permissão de Localização Negada</Text>
        <Text style={[styles.permissionSubtitle, { color: colors.textSecondary }]}>
          Para ver as motos mais próximas de você, ative a permissão de localização.
        </Text>
        <TouchableOpacity 
          onPress={() => setShowBikesWithoutLocation(true)} 
          style={styles.showBikesBtn}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={[colors.primary, '#1F8E4D']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={StyleSheet.absoluteFill} 
          />
          <Text style={styles.showBikesText}>Ver motos disponíveis mesmo assim</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}> 
        <Text style={{ color: colors.error, marginBottom: 12 }}>Não foi possível carregar as motos agora.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn} testID="retry-load">
          <RefreshCw color={'#fff'} size={16} />
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Escolher Moto',
        headerTintColor: '#fff',
        headerBackground: () => (
          <LinearGradient colors={[colors.primary, '#1F8E4D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        ),
      }} />
      <View style={styles.mapBox}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          source={{ html: leafletHTML }}
          style={{ flex: 1 }}
          testID="rent-leaflet"
        />
      </View>

      <View style={styles.overlayTop}>
        <View style={styles.pill}>
          <MapPin size={16} color={colors.text} />
          <Text style={styles.pillText}>Motos disponíveis: {mapped.length}</Text>
        </View>
      </View>

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.iconWrap}><Bike size={20} color={colors.primary} /></View>
              <Text style={styles.sheetTitle}>{selected?.model || selected?.name}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} accessibilityLabel="Fechar">
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSubtitle}>Matrícula: {selected?.plate || '—'}</Text>
            {typeof selected?.distanceKm === 'number' && (
              <Text style={styles.sheetSubtitle}>Distância: {selected?.distanceKm.toFixed(1)} km</Text>
            )}
            <View style={styles.rowBetween}>
              <Text style={styles.price}>€{Number(selected?.monthlyFee || 0).toFixed(2)}/mês</Text>
              <View style={styles.badgeOnline}>
                <View style={styles.dot} />
                <Text style={styles.badgeText}>Disponível</Text>
              </View>
            </View>

            <TouchableOpacity
              disabled={loadingAction}
              onPress={handleConfirm}
              style={[styles.primaryBtn, loadingAction ? { opacity: 0.6 } : null]}
              testID="confirm-rental"
              activeOpacity={0.8}
>
              <LinearGradient colors={[colors.primary, '#1F8E4D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              {loadingAction ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={18} color={'#fff'} />
                  <Text style={styles.primaryBtnText}>Confirmar e pagar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  mapBox: { height: 420 },
  overlayTop: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { color: colors.text, fontWeight: '600' as const },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '700' as const, flex: 1, marginLeft: 8 },
  sheetSubtitle: { color: colors.textSecondary, fontSize: 13 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { color: colors.text, fontSize: 16, fontWeight: '700' as const },
  badgeOnline: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.success + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  badgeText: { color: colors.success, fontSize: 12, fontWeight: '600' as const },
  primaryBtn: { marginTop: 16, flexDirection: 'row', gap: 10, backgroundColor: 'transparent', paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 14, overflow: 'hidden' },
  primaryBtnText: { color: '#fff', fontWeight: '700' as const },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' as const },
  loadingText: { marginTop: 12, fontSize: 14 },
  permissionTitle: { fontSize: 20, fontWeight: '700' as const, marginTop: 16, textAlign: 'center' },
  permissionSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  showBikesBtn: { marginTop: 24, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, overflow: 'hidden', minWidth: 250 },
  showBikesText: { color: '#fff', fontWeight: '700' as const, textAlign: 'center' },
});