import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Order } from './backgroundTasks';
import { supabase } from '@/lib/supabaseClient';

let Notifications: any = null;
let Device: any = null;
let isExpoGoEnvironment = false;

const isRunningInExpoGo = Constants.appOwnership === 'expo';

if (Platform.OS !== 'web' && !isRunningInExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
        }),
      });
    }
  } catch (error) {
    console.log('⚠️ Expo Notifications not available. Using fallback mode.');
    isExpoGoEnvironment = true;
  }
} else {
  console.log('⚠️ Running in Expo Go or Web. Push notifications disabled.');
  isExpoGoEnvironment = true;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isAvailable: boolean = false;

  constructor() {
    this.isAvailable = !isExpoGoEnvironment && Notifications != null && Platform.OS !== 'web';
  }

  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications not supported on web');
        return;
      }

      if (!this.isAvailable) {
        console.log('⚠️ Notifications not available in Expo Go. Use a development build for full notification support.');
        return;
      }

      await this.setupNotificationChannels();
      await this.setupNotificationCategories();
      
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        await this.sendTokenToServer(token);
      }

      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    if (!this.isAvailable || Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Pedidos de Entrega',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lightColor: '#00C853',
      });

      await Notifications.setNotificationChannelAsync('updates', {
        name: 'Atualizações',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Mensagens',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
      });
    } catch (error) {
      console.error('❌ Error setting up notification channels:', error);
    }
  }

  private async setupNotificationCategories(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Notifications.setNotificationCategoryAsync('order', [
        {
          identifier: 'accept',
          buttonTitle: 'Aceitar',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'reject',
          buttonTitle: 'Recusar',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Error setting up notification categories:', error);
    }
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (!this.isAvailable) {
        console.log('⚠️ Push notifications not available');
        return null;
      }

      if (Platform.OS === 'web') {
        return null;
      }

      if (!Device?.isDevice) {
        console.log('⚠️ Push notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Failed to get push notification permissions');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'u7tdceo62al1zyewhmv8k',
      });

      console.log('✅ Push token obtained:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const payload = {
        user_id: userId,
        token,
        platform: Platform.OS,
        device_id: Device?.modelId || 'unknown',
        updated_at: new Date().toISOString(),
      } as const;

      const { error } = await supabase.from('push_tokens').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      console.log('✅ Push token saved to Supabase');
    } catch (error) {
      console.error('❌ Failed to save push token to Supabase:', error);
    }
  }

  async sendNewOrderNotification(order: Order): Promise<void> {
    if (!this.isAvailable) {
      console.log('📱 New order (fallback mode):', order.id);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏍️ Novo Pedido Disponível!',
          body: `${order.pickup.address} → ${order.delivery.address}\n💰 €${order.value.toFixed(2)} • 📍 ${order.distance.toFixed(1)}km • ⏱️ ~${order.estimatedTime}min`,
          data: { 
            orderId: order.id, 
            type: 'new_order',
            order,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
          categoryIdentifier: 'order',
        },
        trigger: null,
      });
      console.log('✅ New order notification sent');
    } catch (error) {
      console.error('❌ Error sending order notification:', error);
    }
  }

  async sendOrderUpdateNotification(orderId: string, status: string, message: string): Promise<void> {
    if (!this.isAvailable) {
      console.log('📱 Order update (fallback mode):', orderId, status);
      return;
    }

    try {
      const statusEmoji = {
        accepted: '✅',
        picked_up: '📦',
        delivered: '🎉',
        cancelled: '❌',
      }[status] || '📋';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${statusEmoji} Atualização do Pedido`,
          body: message,
          data: { 
            orderId, 
            type: 'order_update',
            status,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.DEFAULT,
        },
        trigger: null,
      });
      console.log('✅ Order update notification sent');
    } catch (error) {
      console.error('❌ Error sending update notification:', error);
    }
  }

  async sendMessageNotification(from: string, message: string): Promise<void> {
    if (!this.isAvailable) {
      console.log('📱 New message (fallback mode):', from);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💬 Mensagem de ${from}`,
          body: message,
          data: { 
            type: 'message',
            from,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
        },
        trigger: null,
      });
      console.log('✅ Message notification sent');
    } catch (error) {
      console.error('❌ Error sending message notification:', error);
    }
  }

  async checkPermissions(): Promise<NotificationPermissionStatus> {
    if (!this.isAvailable) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'unavailable',
      };
    }

    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  setupNotificationReceivedListener(handler: (notification: any) => void) {
    if (!this.isAvailable) {
      return { remove: () => {} };
    }
    return Notifications.addNotificationReceivedListener(handler);
  }

  setupNotificationResponseListener(handler: (response: any) => void) {
    if (!this.isAvailable) {
      return { remove: () => {} };
    }
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  async cancelAllNotifications(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }
}

export const notificationService = new NotificationService();
