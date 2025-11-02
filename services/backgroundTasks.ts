import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const BACKGROUND_FETCH_TASK = 'background-fetch-orders';
const CHECK_ORDERS_INTERVAL = 15 * 60;

export interface Order {
  id: string;
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  delivery: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  value: number;
  distance: number;
  estimatedTime: number;
  createdAt: string;
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('📦 Background fetch: checking for new orders...');
    
    const newOrders = await checkForNewOrders();
    
    if (newOrders && newOrders.length > 0) {
      await sendOrderNotification(newOrders[0]);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function checkForNewOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error checking orders:', error);
    return [];
  }
}

async function sendOrderNotification(order: Order) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏍️ Novo Pedido Disponível!',
        body: `${order.pickup.address} → ${order.delivery.address}\nValor: €${order.value.toFixed(2)} • ${order.distance.toFixed(1)}km`,
        data: { orderId: order.id, type: 'new_order' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'order',
      },
      trigger: null,
    });
    console.log('✅ Order notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function registerBackgroundFetchAsync() {
  try {
    if (Platform.OS === 'web') {
      console.log('⚠️ Background fetch not supported on web');
      return { success: false };
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: CHECK_ORDERS_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('✅ Background fetch registered');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to register background fetch:', error);
    return { success: false, error };
  }
}

export async function unregisterBackgroundFetchAsync() {
  try {
    if (Platform.OS === 'web') return;

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('🚫 Background fetch unregistered');
  } catch (error) {
    console.error('Error unregistering background fetch:', error);
  }
}
