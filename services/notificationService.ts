import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order } from './backgroundTasks';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications not supported on web');
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
    if (Platform.OS === 'android') {
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
    }
  }

  private async setupNotificationCategories(): Promise<void> {
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
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return null;
      }

      if (!Device.isDevice) {
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
      const accessToken = await AsyncStorage.getItem('access_token');
      if (!accessToken || accessToken === 'demo') {
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          token,
          platform: Platform.OS,
          deviceId: Device.modelId,
        }),
      });

      if (response.ok) {
        console.log('✅ Push token registered on server');
      }
    } catch (error) {
      console.error('❌ Failed to send token to server:', error);
    }
  }

  async sendNewOrderNotification(order: Order): Promise<void> {
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
          priority: Notifications.AndroidNotificationPriority.HIGH,
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
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });
      console.log('✅ Order update notification sent');
    } catch (error) {
      console.error('❌ Error sending update notification:', error);
    }
  }

  async sendMessageNotification(from: string, message: string): Promise<void> {
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
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
      console.log('✅ Message notification sent');
    } catch (error) {
      console.error('❌ Error sending message notification:', error);
    }
  }

  async checkPermissions(): Promise<NotificationPermissionStatus> {
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

  setupNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  setupNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
