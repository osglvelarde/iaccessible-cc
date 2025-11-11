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
  private connectionPromise: Promise<void> | null = null;
  private connectTimeout: NodeJS.Timeout | null = null;

  /**
   * Connect to Uptime Kuma via Socket.io
   */
  async connect(): Promise<void> {
    // If already connected and authenticated, return immediately
    if (this.socket?.connected && this.isAuthenticated) {
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If socket exists but not connected, wait a bit for reconnection
    if (this.socket && !this.socket.connected) {
      // Wait up to 5 seconds for reconnection
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.socket?.connected && this.isAuthenticated) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (this.socket?.connected && this.isAuthenticated) {
            resolve();
          } else {
            // If still not connected, start a new connection
            this.connectionPromise = null;
            this.connect().then(resolve).catch(reject);
          }
        }, 5000);
      });
    }

    // Start new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Set connection timeout
        this.connectTimeout = setTimeout(() => {
          if (!this.isConnected || !this.isAuthenticated) {
            console.error('[UptimeKumaSocket] Connection timeout');
            this.connectionPromise = null;
            reject(new Error('Connection timeout'));
          }
        }, 30000); // 30 second timeout

        // Clean up existing socket if any
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
        }

        // Create Socket.io connection
        this.socket = io(UPTIME_KUMA_API_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000, // 20 second connection timeout
        });

        let resolved = false;

        // Connection successful
        this.socket.once('connect', () => {
          console.log('[UptimeKumaSocket] Connected to Uptime Kuma');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate and resolve
          this.authenticate()
            .then(() => {
              if (this.connectTimeout) {
                clearTimeout(this.connectTimeout);
                this.connectTimeout = null;
              }
              if (!resolved) {
                resolved = true;
                this.connectionPromise = null;
                resolve();
              }
            })
            .catch((error) => {
              if (this.connectTimeout) {
                clearTimeout(this.connectTimeout);
                this.connectTimeout = null;
              }
              if (!resolved) {
                resolved = true;
                this.connectionPromise = null;
                reject(error);
              }
            });
        });

        // Connection error - don't reject immediately, let socket.io retry
        this.socket.on('connect_error', (error) => {
          console.error('[UptimeKumaSocket] Connection error:', error);
          this.isConnected = false;
          // Don't reject here - let socket.io handle reconnection
          // Only reject if we've exhausted all retries
        });

        // Disconnected
        this.socket.on('disconnect', (reason) => {
          console.log('[UptimeKumaSocket] Disconnected:', reason);
          this.isConnected = false;
          this.isAuthenticated = false;
          this.connectionPromise = null;
        });

        // Reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`[UptimeKumaSocket] Reconnection attempt ${attemptNumber}`);
          this.reconnectAttempts = attemptNumber;
        });

        // Reconnection failed after all attempts
        this.socket.on('reconnect_failed', () => {
          console.error('[UptimeKumaSocket] Reconnection failed after all attempts');
          if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
          }
          if (!resolved) {
            resolved = true;
            this.connectionPromise = null;
            reject(new Error('Failed to connect after all retry attempts'));
          }
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
            console.log('[UptimeKumaSocket] Authenticated');
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
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Authenticate with Uptime Kuma
   */
  private async authenticate(): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    // If already authenticated, return immediately
    if (this.isAuthenticated) {
      return;
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.isAuthenticated = false;
          reject(new Error('Authentication timeout'));
        }
      }, 10000);

      // Handle token event (Uptime Kuma may respond via event instead of callback)
      const tokenHandler = (data: { token: string } | string) => {
        const token = typeof data === 'string' ? data : data?.token;
        if (token && !resolved) {
          clearTimeout(timeout);
          resolved = true;
          this.isAuthenticated = true;
          console.log('[UptimeKumaSocket] Authenticated');
          if (this.socket) {
            this.socket.off('token', tokenHandler);
          }
          resolve();
        }
      };
      if (this.socket) {
        this.socket.once('token', tokenHandler);
      }

      // Send login request
      this.socket!.emit('login', {
        username: UPTIME_KUMA_USERNAME,
        password: UPTIME_KUMA_PASSWORD,
      }, (response: any) => {
        if (resolved) return;
        
        if (response && response.token) {
          clearTimeout(timeout);
          this.socket?.off('token', tokenHandler);
          resolved = true;
          this.isAuthenticated = true;
          console.log('[UptimeKumaSocket] Authenticated');
          resolve();
        } else if (response && response.error) {
          clearTimeout(timeout);
          this.socket?.off('token', tokenHandler);
          resolved = true;
          this.isAuthenticated = false;
          reject(new Error(response.error || 'Authentication failed'));
        }
        // If no token in callback and no error, wait for token event (handler already set up)
      });
    });
  }

  /**
   * Handle incoming heartbeat event
   */
  private handleHeartbeat(heartbeat: HeartbeatEvent): void {
    const monitorId = heartbeat.monitorID;
    const callbacks = this.heartbeatCallbacks.get(monitorId);
    
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach((callback) => {
        try {
          callback(heartbeat);
        } catch (error) {
          console.error('[UptimeKumaSocket] Error in heartbeat callback:', error);
        }
      });
    }
    // Silently ignore heartbeats for monitors we're not subscribed to
  }

  /**
   * Subscribe to heartbeat events for a specific monitor
   */
  subscribeToMonitor(monitorId: number, callback: HeartbeatCallback): () => void {
    // Add callback first
    if (!this.heartbeatCallbacks.has(monitorId)) {
      this.heartbeatCallbacks.set(monitorId, new Set());
    }
    this.heartbeatCallbacks.get(monitorId)!.add(callback);

    // Ensure connection and authentication
    // Uptime Kuma broadcasts heartbeat events to all authenticated clients automatically
    // We just need to ensure we're connected and authenticated, then filter by monitorId
    if (!this.isConnected || !this.isAuthenticated) {
      this.connect().catch((error) => {
        console.error('[UptimeKumaSocket] Failed to connect:', error);
      });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.heartbeatCallbacks.get(monitorId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.heartbeatCallbacks.delete(monitorId);
          // Optionally unsubscribe from monitor if no more callbacks
          if (this.socket && this.isAuthenticated) {
            // Uptime Kuma might support unsubscribing, but it's not critical
            // The server will stop sending if no one is listening
          }
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
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    this.connectionPromise = null;
    
    if (this.socket) {
      this.socket.removeAllListeners();
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

