import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '@/lib/trpc';

export type WebSocketMessage = {
  type: 'new_order' | 'order_update' | 'order_cancelled' | 'ping';
  data?: any;
  timestamp: string;
};

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 5000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<WebSocketEventHandler> = new Set();
  private isIntentionallyClosed: boolean = false;

  constructor() {
    if (Platform.OS === 'web') {
      console.log('⚠️ WebSocket service running on web');
    }
  }

  async connect(userId: string) {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('✅ WebSocket already connected');
        return;
      }

      this.isIntentionallyClosed = false;
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token || token === 'demo') {
        console.log('⚠️ No valid token for WebSocket connection');
        return;
      }

      const base = getBaseUrl();
      if (!base) {
        console.log('⚠️ Missing backend URL; skipping WebSocket connection');
        return;
      }
      const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
      const wsHost = base.replace(/^https?:\/\//, '');
      this.url = `${wsProtocol}://${wsHost}/ws?token=${token}&userId=${userId}`;

      console.log('🔌 Connecting to WebSocket...');
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message.type);
          this.notifyListeners(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        this.stopPingInterval();
        
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(userId);
        }
      };
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      this.scheduleReconnect(userId);
    }
  }

  private scheduleReconnect(userId: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * this.reconnectAttempts, 60000);
    
    console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(userId);
    }, delay);
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  subscribe(handler: WebSocketEventHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(message: WebSocketMessage) {
    this.listeners.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ Error in WebSocket listener:', error);
      }
    });
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
