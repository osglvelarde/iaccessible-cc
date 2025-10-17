/**
 * Uptime Kuma Client
 * 
 * This client provides a REST-like interface to Uptime Kuma's Socket.io API.
 * It uses the SocketService for real-time communication and provides
 * a clean API for the application to use.
 */

import {
  Monitor,
  MonitorMetrics,
  CreateMonitorRequest,
  MonitorListResponse,
  MonitorMetricsResponse,
  KumaApiResponse,
  MonitorStatus,
  MonitorType
} from './types/monitoring';
import { 
  getMonitors as getKumaMonitors, 
  getMonitor as getKumaMonitor, 
  createMonitor as createKumaMonitor, 
  deleteMonitor as deleteKumaMonitor, 
  getMonitorMetrics as getKumaMonitorMetrics, 
  testConnection as testKumaConnection 
} from './kumaSocket';

// Server-side only - never import this in client components
if (typeof window !== 'undefined') {
  throw new Error('kumaClient.ts is server-side only and cannot be imported in client components');
}

class KumaClient {
  /**
   * Map Uptime Kuma monitor data to our Monitor interface
   */
  private mapKumaMonitorToMonitor(kumaMonitor: any): Monitor {
    const statusMap: Record<number, MonitorStatus> = {
      0: 'down',
      1: 'up',
      2: 'pending',
      3: 'maintenance'
    };

    return {
      id: kumaMonitor.id,
      name: kumaMonitor.name,
      url: kumaMonitor.url,
      type: kumaMonitor.type as MonitorType,
      status: statusMap[kumaMonitor.status] || 'pending',
      interval: kumaMonitor.interval || 300,
      uptime: kumaMonitor.uptime || 0,
      avgResponseTime: kumaMonitor.avgPing || 0,
      lastCheck: kumaMonitor.lastCheck || new Date().toISOString(),
      createdAt: kumaMonitor.createdDate || new Date().toISOString(),
      updatedAt: kumaMonitor.updatedDate || new Date().toISOString(),
    };
  }

  /**
   * Get all monitors
   */
  async getMonitors(): Promise<KumaApiResponse<Monitor[]>> {
    try {
      const kumaMonitors = await getKumaMonitors();
      const monitors = kumaMonitors.map(this.mapKumaMonitorToMonitor);
      
      return {
        ok: true,
        data: monitors
      };
    } catch (error) {
      console.error('Error getting monitors:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to get monitors'
      };
    }
  }

  /**
   * Get single monitor
   */
  async getMonitor(id: number): Promise<KumaApiResponse<Monitor>> {
    try {
      const kumaMonitor = await getKumaMonitor(id);
      const monitor = this.mapKumaMonitorToMonitor(kumaMonitor);
      
      return {
        ok: true,
        data: monitor
      };
    } catch (error) {
      console.error('Error getting monitor:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to get monitor'
      };
    }
  }

  /**
   * Create new monitor
   */
  async createMonitor(monitorData: CreateMonitorRequest): Promise<KumaApiResponse<Monitor>> {
    try {
      const kumaMonitorData = {
        type: 'http',
        name: monitorData.name,
        url: monitorData.url,
        method: 'GET',
        interval: monitorData.interval || 60,
        maxretries: 0,
        retryInterval: 60,
        ignoreTls: false,
        upsideDown: false,
        notificationIDList: [],
      };

      const kumaMonitor = await createKumaMonitor(kumaMonitorData);
      const monitor = this.mapKumaMonitorToMonitor(kumaMonitor);
      
      return {
        ok: true,
        data: monitor
      };
    } catch (error) {
      console.error('Error creating monitor:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create monitor'
      };
    }
  }

  /**
   * Delete monitor
   */
  async deleteMonitor(id: number): Promise<KumaApiResponse<boolean>> {
    try {
      await deleteKumaMonitor(id);
      return {
        ok: true,
        data: true
      };
    } catch (error) {
      console.error('Error deleting monitor:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to delete monitor'
      };
    }
  }

  /**
   * Get monitor metrics
   */
  async getMonitorMetrics(id: number, range: string = '24h'): Promise<KumaApiResponse<MonitorMetrics>> {
    try {
      // Convert range to hours
      const rangeMap: Record<string, number> = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
      };
      
      const period = rangeMap[range] || 24;
      const kumaMetrics = await getKumaMonitorMetrics(id, period);
      
      // Map the chart data to our MonitorMetrics interface
      const metrics: MonitorMetrics = {
        monitorId: id,
        uptime: 0, // This would need to be calculated from the chart data
        avgResponseTime: 0,
        totalChecks: kumaMetrics.length,
        successfulChecks: kumaMetrics.filter((point: any) => point.up).length,
        failedChecks: kumaMetrics.filter((point: any) => !point.up).length,
        dataPoints: kumaMetrics.map((point: any) => ({
          timestamp: new Date(point.timestamp).toISOString(),
          responseTime: point.ping || 0,
          status: point.up ? 'up' : 'down'
        }))
      };
      
      return {
        ok: true,
        data: metrics
      };
    } catch (error) {
      console.error('Error getting monitor metrics:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to get metrics'
      };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<KumaApiResponse<boolean>> {
    try {
      const connected = await testKumaConnection();
      return {
        ok: connected,
        data: connected,
        error: connected ? undefined : 'Connection failed'
      };
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const kumaClient = new KumaClient();
