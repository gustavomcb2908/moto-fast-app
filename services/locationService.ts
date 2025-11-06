import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationUpdate {
  coords: LocationCoords;
  timestamp: number;
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('❌ Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    console.log('📍 Background location update:', locations);

    for (const location of locations) {
      await sendLocationToServer(location);
    }
  }
});

async function sendLocationToServer(location: Location.LocationObject) {
  try {
    const activeOrderId = await AsyncStorage.getItem('active_order_id');
    if (!activeOrderId) {
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;

    const payload = {
      order_id: activeOrderId,
      user_id: userId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? null,
      heading: location.coords.heading ?? null,
      speed: location.coords.speed ?? null,
      timestamp: new Date(location.timestamp).toISOString(),
    } as const;

    const { error } = await supabase.from('order_locations').insert(payload);
    if (error) throw error;

    console.log('✅ Location saved to Supabase');
  } catch (error) {
    console.error('❌ Failed to save location to Supabase:', error);
  }
}

class LocationService {
  private isTracking: boolean = false;
  private foregroundSubscription: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('⚠️ Location tracking limited on web');
        return false;
      }

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('⚠️ Background location permission denied');
        return false;
      }

      console.log('✅ Location permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      return {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return { foreground: false, background: false };
    }
  }

  async startBackgroundTracking(orderId: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('⚠️ Background location not supported on web');
        return false;
      }

      const permissions = await this.checkPermissions();
      if (!permissions.background) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      await AsyncStorage.setItem('active_order_id', orderId);

      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      
      if (!isRegistered) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
          foregroundService: {
            notificationTitle: 'Moto Fast - Entrega Ativa',
            notificationBody: 'Rastreando sua localização',
            notificationColor: '#00C853',
          },
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
        });

        this.isTracking = true;
        console.log('✅ Background location tracking started');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to start background tracking:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('🛑 Background location tracking stopped');
      }

      await AsyncStorage.removeItem('active_order_id');
      this.isTracking = false;
    } catch (error) {
      console.error('❌ Error stopping background tracking:', error);
    }
  }

  async startForegroundTracking(
    callback: (location: Location.LocationObject) => void
  ): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      this.foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback
      );

      console.log('✅ Foreground location tracking started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start foreground tracking:', error);
      return false;
    }
  }

  async stopForegroundTracking(): Promise<void> {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
      this.foregroundSubscription = null;
      console.log('🛑 Foreground location tracking stopped');
    }
  }

  async getCurrentLocation(): Promise<LocationUpdate | null> {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.foreground) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
        },
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
