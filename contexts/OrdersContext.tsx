import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { websocketService, WebSocketMessage } from '@/services/websocket';
import { notificationService } from '@/services/notificationService';
import { locationService } from '@/services/locationService';
import type { Order } from '@/services/backgroundTasks';

interface OrdersState {
  availableOrders: Order[];
  activeOrder: Order | null;
  completedOrders: Order[];
  isLoading: boolean;
  isOnline: boolean;
}

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const auth = useAuth();
  const [ordersState, setOrdersState] = useState<OrdersState>({
    availableOrders: [],
    activeOrder: null,
    completedOrders: [],
    isLoading: true,
    isOnline: false,
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    if (auth.isAuthenticated && auth.user) {
      initializeServices().then((cleanupFn) => {
        if (!mounted) return;
        cleanup = cleanupFn;
      });
    } else {
      setOrdersState(prev => ({ ...prev, isLoading: false }));
    }

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      cleanupServices();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.user?.id]);

  const initializeServices = async () => { let isMounted = true;
    try {
      if (Platform.OS !== 'web') {
        await notificationService.initialize();
        await locationService.requestPermissions();
      }

      if (auth.user?.id) {
        await websocketService.connect(auth.user.id);
        
        const unsubscribe = websocketService.subscribe(handleWebSocketMessage);
        
        if (isMounted) { setOrdersState(prev => ({ ...prev, isOnline: true })); }

        return () => {
          unsubscribe();
        };
      }
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
    } finally {
      if (isMounted) {
        setOrdersState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  const cleanupServices = () => {
    websocketService.disconnect();
    locationService.stopBackgroundTracking();
    locationService.stopForegroundTracking();
  };

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('📨 Handling WebSocket message:', message.type);

    switch (message.type) {
      case 'new_order':
        handleNewOrder(message.data);
        break;
      case 'order_update':
        handleOrderUpdate(message.data);
        break;
      case 'order_cancelled':
        handleOrderCancelled(message.data);
        break;
    }
  }, []);

  const handleNewOrder = async (order: Order) => {
    console.log('🆕 New order received:', order.id);
    
    setOrdersState(prev => ({
      ...prev,
      availableOrders: [order, ...prev.availableOrders],
    }));

    if (Platform.OS !== 'web') {
      await notificationService.sendNewOrderNotification(order);
    }
  };

  const handleOrderUpdate = async (data: { orderId: string; status: string; message: string }) => {
    console.log('🔄 Order update:', data);

    setOrdersState(prev => {
      if (prev.activeOrder?.id === data.orderId) {
        return {
          ...prev,
          activeOrder: {
            ...prev.activeOrder,
            status: data.status as Order['status'],
          },
        };
      }
      return prev;
    });

    if (Platform.OS !== 'web') {
      await notificationService.sendOrderUpdateNotification(
        data.orderId,
        data.status,
        data.message
      );
    }
  };

  const handleOrderCancelled = (data: { orderId: string }) => {
    console.log('❌ Order cancelled:', data.orderId);

    setOrdersState(prev => ({
      ...prev,
      availableOrders: prev.availableOrders.filter(o => o.id !== data.orderId),
      activeOrder: prev.activeOrder?.id === data.orderId ? null : prev.activeOrder,
    }));
  };

  const acceptOrder = useCallback(async (orderId: string) => {
    try {
      const order = ordersState.availableOrders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      websocketService.send({
        type: 'order_update',
        data: { orderId, action: 'accept' },
        timestamp: new Date().toISOString(),
      });

      setOrdersState(prev => ({
        ...prev,
        availableOrders: prev.availableOrders.filter(o => o.id !== orderId),
        activeOrder: { ...order, status: 'accepted' },
      }));

      if (Platform.OS !== 'web') {
        await locationService.startBackgroundTracking(orderId);
      }

      router.push('/orders');

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to accept order:', error);
      return { success: false, error };
    }
  }, [ordersState.availableOrders]);

  const rejectOrder = useCallback(async (orderId: string) => {
    try {
      websocketService.send({
        type: 'order_update',
        data: { orderId, action: 'reject' },
        timestamp: new Date().toISOString(),
      });

      setOrdersState(prev => ({
        ...prev,
        availableOrders: prev.availableOrders.filter(o => o.id !== orderId),
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to reject order:', error);
      return { success: false, error };
    }
  }, []);

  const markAsPickedUp = useCallback(async () => {
    try {
      if (!ordersState.activeOrder) {
        throw new Error('No active order');
      }

      const orderId = ordersState.activeOrder.id;

      websocketService.send({
        type: 'order_update',
        data: { orderId, action: 'picked_up' },
        timestamp: new Date().toISOString(),
      });

      setOrdersState(prev => ({
        ...prev,
        activeOrder: prev.activeOrder
          ? { ...prev.activeOrder, status: 'picked_up' }
          : null,
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to mark as picked up:', error);
      return { success: false, error };
    }
  }, [ordersState.activeOrder]);

  const markAsDelivered = useCallback(async () => {
    try {
      if (!ordersState.activeOrder) {
        throw new Error('No active order');
      }

      const orderId = ordersState.activeOrder.id;

      websocketService.send({
        type: 'order_update',
        data: { orderId, action: 'delivered' },
        timestamp: new Date().toISOString(),
      });

      const deliveredOrder = {
        ...ordersState.activeOrder,
        status: 'delivered' as const,
      };

      setOrdersState(prev => ({
        ...prev,
        activeOrder: null,
        completedOrders: [deliveredOrder, ...prev.completedOrders],
      }));

      if (Platform.OS !== 'web') {
        await locationService.stopBackgroundTracking();
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to mark as delivered:', error);
      return { success: false, error };
    }
  }, [ordersState.activeOrder]);

  const toggleOnlineStatus = useCallback(async () => {
    const newStatus = !ordersState.isOnline;
    
    if (newStatus) {
      if (auth.user?.id) {
        await websocketService.connect(auth.user.id);
      }
    } else {
      websocketService.disconnect();
    }

    setOrdersState(prev => ({ ...prev, isOnline: newStatus }));
  }, [ordersState.isOnline, auth.user?.id]);

  const refreshOrders = useCallback(async () => {
    setOrdersState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🔄 Refreshing orders...');
      
      if (websocketService.isConnected()) {
        websocketService.send({
          type: 'ping',
          timestamp: new Date().toISOString(),
        });
      } else if (auth.user?.id) {
        await websocketService.connect(auth.user.id);
      }
    } catch (error) {
      console.error('❌ Failed to refresh orders:', error);
    } finally {
      setOrdersState(prev => ({ ...prev, isLoading: false }));
    }
  }, [auth.user?.id]);

  return useMemo(() => ({
    ...ordersState,
    acceptOrder,
    rejectOrder,
    markAsPickedUp,
    markAsDelivered,
    toggleOnlineStatus,
    refreshOrders,
  }), [
    ordersState,
    acceptOrder,
    rejectOrder,
    markAsPickedUp,
    markAsDelivered,
    toggleOnlineStatus,
    refreshOrders,
  ]);
});
