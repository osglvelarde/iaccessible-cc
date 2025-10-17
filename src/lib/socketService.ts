/**
 * Uptime Kuma Socket.io Service
 * 
 * This service handles real-time communication with Uptime Kuma using Socket.io.
 * It provides a singleton service that manages the connection, authentication,
 * and real-time data updates.
 */

import { io, Socket } from 'socket.io-client';
import { Monitor, MonitorMetrics, CreateMonitorRequest } from './types/monitoring';

export interface SocketServiceEvents {
  onMonitorsUpdate: (monitors: Monitor[]) => void;
  onMonitorUpdate: (monitor: Monitor) => void;
  onHeartbeat: (heartbeat: any) => void;
  onUptimeUpdate: (monitorId: number, uptime: number) => void;
  onConnectionStatusChange: (connected: boolean) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Partial<SocketServiceEvents> = {};
  private monitors: Map<number, Monitor> = new Map();

  constructor() {
    // Server-side only
    if (typeof window !== 'undefined') {
      throw new Error('SocketService is server-side only and cannot be imported in client components');
    }
  }

  /**
   * Initialize connection to Uptime Kuma
   */
  async connect(): Promise<boolean> {
    try {
      const { KUMA_BASE_URL, KUMA_USERNAME, KUMA_PASSWORD } = process.env;
      
      if (!KUMA_USERNAME || !KUMA_PASSWORD) {
        throw new Error('KUMA_USERNAME / KUMA_PASSWORD missing from environment variables');
      }

      console.log(`[Kuma] Connecting to Uptime Kuma at ${KUMA_BASE_URL}`);
      console.log(`[Kuma] Logging in as ${KUMA_USERNAME}`);

      this.socket = io(KUMA_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
      
      // Authenticate after connection
      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('Connected to Uptime Kuma');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('onConnectionStatusChange', true);
          this.authenticate(KUMA_USERNAME, KUMA_PASSWORD).then(resolve);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.isConnected = false;
          this.emit('onConnectionStatusChange', false);
          resolve(false);
        });

        this.socket!.on('disconnect', () => {
          console.log('Disconnected from Uptime Kuma');
          this.isConnected = false;
          this.isAuthenticated = false;
          this.emit('onConnectionStatusChange', false);
        });
      });
    } catch (error) {
      console.error('Failed to connect to Uptime Kuma:', error);
      return false;
    }
  }

  /**
   * Authenticate with Uptime Kuma
   */
  private async authenticate(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(false);
        return;
      }

      this.socket.emit('login', { username, password }, (response: any) => {
        if (response && response.ok) {
          console.log('Authenticated with Uptime Kuma');
          this.isAuthenticated = true;
          resolve(true);
        } else {
          console.error('Authentication failed:', response?.msg || 'Unknown error');
          this.isAuthenticated = false;
          resolve(false);
        }
      });
    });
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Monitor list updates
    this.socket.on('monitorList', (monitors: any) => {
      console.log('Received monitor list:', Object.keys(monitors).length, 'monitors');
      this.updateMonitorsFromSocket(monitors);
      this.emit('onMonitorsUpdate', Array.from(this.monitors.values()));
    });

    // Individual monitor updates
    this.socket.on('updateMonitorIntoList', (monitors: any) => {
      console.log('Monitor updated');
      this.updateMonitorsFromSocket(monitors);
      Object.values(monitors).forEach((monitor: any) => {
        this.emit('onMonitorUpdate', this.mapSocketMonitorToMonitor(monitor));
      });
    });

    // Monitor deletion
    this.socket.on('deleteMonitorFromList', (monitorId: number) => {
      console.log('Monitor deleted:', monitorId);
      this.monitors.delete(monitorId);
      this.emit('onMonitorsUpdate', Array.from(this.monitors.values()));
    });

    // Real-time heartbeat updates
    this.socket.on('heartbeat', (heartbeat: any) => {
      console.log('Heartbeat received for monitor:', heartbeat.monitorID);
      this.emit('onHeartbeat', heartbeat);
      
      // Update monitor status
      const monitor = this.monitors.get(heartbeat.monitorID);
      if (monitor) {
        const statusMap: Record<number, 'up' | 'down' | 'pending' | 'maintenance'> = {
          0: 'down',
          1: 'up',
          2: 'pending',
          3: 'maintenance'
        };
        
        monitor.status = statusMap[heartbeat.status] || 'pending';
        monitor.avgResponseTime = heartbeat.ping || 0;
        monitor.lastCheck = heartbeat.time;
        
        this.emit('onMonitorUpdate', monitor);
      }
    });

    // Uptime updates
    this.socket.on('uptime', (data: { monitorID: number, periodKey: string, percentage: number }) => {
      console.log('Uptime update:', data);
      this.emit('onUptimeUpdate', data.monitorID, data.percentage);
      
      // Update monitor uptime
      const monitor = this.monitors.get(data.monitorID);
      if (monitor) {
        monitor.uptime = data.percentage;
        this.emit('onMonitorUpdate', monitor);
      }
    });
  }

  /**
   * Update monitors from Socket.io data
   */
  private updateMonitorsFromSocket(socketMonitors: any) {
    Object.values(socketMonitors).forEach((monitor: any) => {
      const mappedMonitor = this.mapSocketMonitorToMonitor(monitor);
      this.monitors.set(mappedMonitor.id, mappedMonitor);
    });
  }

  /**
   * Map Socket.io monitor data to our Monitor interface
   */
  private mapSocketMonitorToMonitor(socketMonitor: any): Monitor {
    const statusMap: Record<number, 'up' | 'down' | 'pending' | 'maintenance'> = {
      0: 'down',
      1: 'up', 
      2: 'pending',
      3: 'maintenance'
    };

    return {
      id: socketMonitor.id,
      name: socketMonitor.name,
      url: socketMonitor.url,
      type: socketMonitor.type as any,
      status: statusMap[socketMonitor.status] || 'pending',
      interval: socketMonitor.interval || 300,
      uptime: socketMonitor.uptime || 0,
      avgResponseTime: socketMonitor.avgPing || 0,
      lastCheck: socketMonitor.lastCheck || new Date().toISOString(),
      createdAt: socketMonitor.createdDate || new Date().toISOString(),
      updatedAt: socketMonitor.updatedDate || new Date().toISOString(),
    };
  }

  /**
   * Get all monitors
   */
  getMonitors(): Monitor[] {
    return Array.from(this.monitors.values());
  }

  /**
   * Get single monitor
   */
  getMonitor(id: number): Monitor | undefined {
    return this.monitors.get(id);
  }

  /**
   * Create new monitor
   */
  async createMonitor(monitorData: CreateMonitorRequest): Promise<{ ok: boolean; data?: Monitor; error?: string }> {
    if (!this.socket || !this.isAuthenticated) {
      return { ok: false, error: 'Not connected or authenticated' };
    }

    return new Promise((resolve) => {
      const socketMonitor = {
        name: monitorData.name,
        url: monitorData.url,
        type: monitorData.type || 'http',
        interval: monitorData.interval || 300,
        active: true,
        // Add other required fields with defaults
        method: 'GET',
        retryInterval: 60,
        resendInterval: 0,
        maxretries: 0,
        hostname: null,
        port: null,
        tags: [],
        notificationIDList: {},
        accepted_statuscodes_json: '["200-299"]',
        conditions: '[]'
      };

      this.socket!.emit('add', socketMonitor, (response: any) => {
        if (response.ok) {
          // The monitor will be added via the monitorList event
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: response.msg || 'Failed to create monitor' });
        }
      });
    });
  }

  /**
   * Delete monitor
   */
  async deleteMonitor(id: number): Promise<{ ok: boolean; error?: string }> {
    if (!this.socket || !this.isAuthenticated) {
      return { ok: false, error: 'Not connected or authenticated' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('deleteMonitor', id, (response: any) => {
        if (response.ok) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: response.msg || 'Failed to delete monitor' });
        }
      });
    });
  }

  /**
   * Get monitor metrics (chart data)
   */
  async getMonitorMetrics(id: number, period: number = 24): Promise<{ ok: boolean; data?: MonitorMetrics; error?: string }> {
    if (!this.socket || !this.isAuthenticated) {
      return { ok: false, error: 'Not connected or authenticated' };
    }

    return new Promise((resolve) => {
      this.socket!.emit('getMonitorChartData', { monitorID: id, period }, (response: any) => {
        if (response.ok && response.data) {
          // Map the chart data to our MonitorMetrics interface
          const metrics: MonitorMetrics = {
            monitorId: id,
            uptime: 0, // This would need to be calculated from the chart data
            avgResponseTime: 0,
            totalChecks: response.data.length,
            successfulChecks: response.data.filter((point: any) => point.up).length,
            failedChecks: response.data.filter((point: any) => !point.up).length,
            dataPoints: response.data.map((point: any) => ({
              timestamp: new Date(point.timestamp).toISOString(),
              responseTime: point.ping || 0,
              status: point.up ? 'up' : 'down'
            }))
          };
          resolve({ ok: true, data: metrics });
        } else {
          resolve({ ok: false, error: response.msg || 'Failed to get metrics' });
        }
      });
    });
  }

  /**
   * Event emitter
   */
  on<K extends keyof SocketServiceEvents>(event: K, handler: SocketServiceEvents[K]) {
    this.eventHandlers[event] = handler;
  }

  /**
   * Emit event
   */
  private emit<K extends keyof SocketServiceEvents>(event: K, ...args: Parameters<SocketServiceEvents[K]>) {
    const handler = this.eventHandlers[event];
    if (handler) {
      (handler as any)(...args);
    }
  }

  /**
   * Disconnect from Uptime Kuma
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isAuthenticated = false;
    this.monitors.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated
    };
  }
}

// Export singleton instance
export const socketService = new SocketService();
