/**
 * Socket.io Connection Service for Uptime Kuma
 * 
 * Manages persistent Socket.io connection to Uptime Kuma for real-time heartbeat events.
 * Uses singleton pattern to maintain a single connection across the application.
 */

import { io, Socket } from 'socket.io-client';

const UPTIME_KUMA_API_URL = process.env.UPTIME_KUMA_API_URL || 'http://localhost:3003';
const UPTIME_KUMA_USERNAME = process.env.UPTIME_KUMA_USERNAME || 'admin';
const UPTIME_KUMA_PASSWORD = process.env.UPTIME_KUMA_PASSWORD || 'admin123';

export interface HeartbeatEvent {
  monitorID: number;
  status: number; // 0 = down, 1 = up, 2 = pending
  msg: string;
  time: string;
  ping: number;
  duration?: number;
  important?: boolean;
  down_count?: number;
}

type HeartbeatCallback = (heartbeat: HeartbeatEvent) => void;

class UptimeKumaSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private heartbeatCallbacks: Map<number, Set<HeartbeatCallback>> = new Map();

  /**
   * Connect to Uptime Kuma via Socket.io
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create Socket.io connection
        this.socket = io(UPTIME_KUMA_API_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        // Connection successful
        this.socket.on('connect', () => {
          console.log('[UptimeKumaSocket] Connected to Uptime Kuma');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.authenticate()
            .then(() => resolve())
            .catch(reject);
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('[UptimeKumaSocket] Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Disconnected
        this.socket.on('disconnect', (reason) => {
          console.log('[UptimeKumaSocket] Disconnected:', reason);
          this.isConnected = false;
          this.isAuthenticated = false;
        });

        // Reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`[UptimeKumaSocket] Reconnection attempt ${attemptNumber}`);
          this.reconnectAttempts = attemptNumber;
        });

        // Listen for heartbeat events
        this.socket.on('heartbeat', (data: HeartbeatEvent) => {
          this.handleHeartbeat(data);
        });

        // Listen for authentication response (token event)
        const tokenHandler = (data: { token: string } | string) => {
          const token = typeof data === 'string' ? data : data?.token;
          if (token) {
            this.isAuthenticated = true;
            console.log('[UptimeKumaSocket] Authenticated successfully');
            this.socket?.off('token', tokenHandler);
          }
        };
        this.socket.on('token', tokenHandler);

        // Listen for authentication errors
        const authErrorHandler = (error: Error) => {
          if (error.message.includes('authentication') || error.message.includes('login') || error.message.includes('401')) {
            this.isAuthenticated = false;
            console.error('[UptimeKumaSocket] Authentication error:', error);
          }
        };
        this.socket.on('connect_error', authErrorHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate with Uptime Kuma
   */
  private async authenticate(): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      // Send login request
      this.socket!.emit('login', {
        username: UPTIME_KUMA_USERNAME,
        password: UPTIME_KUMA_PASSWORD,
      }, (response: any) => {
        clearTimeout(timeout);
        if (response && response.token) {
          this.isAuthenticated = true;
          console.log('[UptimeKumaSocket] Authenticated');
          resolve();
        } else {
          this.isAuthenticated = false;
          reject(new Error('Authentication failed'));
        }
      });
    });
  }

  /**
   * Handle incoming heartbeat event
   */
  private handleHeartbeat(heartbeat: HeartbeatEvent): void {
    const monitorId = heartbeat.monitorID;
    const callbacks = this.heartbeatCallbacks.get(monitorId);
    
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(heartbeat);
        } catch (error) {
          console.error('[UptimeKumaSocket] Error in heartbeat callback:', error);
        }
      });
    }
  }

  /**
   * Subscribe to heartbeat events for a specific monitor
   */
  subscribeToMonitor(monitorId: number, callback: HeartbeatCallback): () => void {
    // Ensure connection
    if (!this.isConnected || !this.isAuthenticated) {
      this.connect().catch((error) => {
        console.error('[UptimeKumaSocket] Failed to connect:', error);
      });
    }

    // Add callback
    if (!this.heartbeatCallbacks.has(monitorId)) {
      this.heartbeatCallbacks.set(monitorId, new Set());
    }
    this.heartbeatCallbacks.get(monitorId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.heartbeatCallbacks.get(monitorId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.heartbeatCallbacks.delete(monitorId);
        }
      }
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; authenticated: boolean } {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
    };
  }

  /**
   * Disconnect from Uptime Kuma
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.heartbeatCallbacks.clear();
      console.log('[UptimeKumaSocket] Disconnected');
    }
  }
}

// Export singleton instance
export const uptimeKumaSocket = new UptimeKumaSocketService();

