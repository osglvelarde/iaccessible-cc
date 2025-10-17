/**
 * Uptime Kuma HTTP Client
 * 
 * This client uses HTTP requests to interact with Uptime Kuma's REST API
 * instead of Socket.io, which is more suitable for server-side Next.js API routes.
 */

import {
  Monitor,
  MonitorMetrics,
  CreateMonitorRequest,
  KumaApiResponse,
  MonitorStatus,
  MonitorType
} from './types/monitoring';

// Server-side only - never import this in client components
if (typeof window !== 'undefined') {
  throw new Error('httpKumaClient.ts is server-side only and cannot be imported in client components');
}

class HttpKumaClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private sessionToken: string | null = null;

  constructor() {
    const { KUMA_BASE_URL, KUMA_USERNAME, KUMA_PASSWORD } = process.env;
    
    if (!KUMA_BASE_URL || !KUMA_USERNAME || !KUMA_PASSWORD) {
      throw new Error('KUMA_BASE_URL, KUMA_USERNAME, and KUMA_PASSWORD must be set in environment variables');
    }
    
    this.baseUrl = KUMA_BASE_URL;
    this.username = KUMA_USERNAME;
    this.password = KUMA_PASSWORD;
  }

  /**
   * Authenticate with Uptime Kuma and get session token
   */
  private async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (!response.ok) {
        console.error('Authentication failed:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      this.sessionToken = data.token;
      console.log('Authenticated with Uptime Kuma');
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /**
   * Make authenticated request to Uptime Kuma API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<KumaApiResponse<T>> {
    try {
      // Ensure we're authenticated
      if (!this.sessionToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return {
            ok: false,
            error: 'Authentication failed'
          };
        }
      }

      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        // If unauthorized, try to re-authenticate once
        if (response.status === 401 && this.sessionToken) {
          this.sessionToken = null;
          const reAuth = await this.authenticate();
          if (reAuth) {
            // Retry the request
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.sessionToken}`,
                ...options.headers,
              },
            });
            
            if (!retryResponse.ok) {
              return {
                ok: false,
                error: `API request failed: ${retryResponse.status} ${retryResponse.statusText}`
              };
            }
            
            const retryData = await retryResponse.json();
            return {
              ok: true,
              data: retryData
            };
          }
        }
        
        return {
          ok: false,
          error: `API request failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        ok: true,
        data
      };
    } catch (error) {
      console.error('Request error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }

  /**
   * Get all monitors
   */
  async getMonitors(): Promise<KumaApiResponse<Monitor[]>> {
    try {
      const result = await this.makeRequest<Monitor[]>('/api/monitors');
      
      if (!result.ok) {
        return {
          ok: false,
          error: result.error || 'Failed to fetch monitors'
        };
      }

      // Map the API response to our Monitor interface
      const monitors = result.data?.map(this.mapApiMonitorToMonitor) || [];
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
      const result = await this.makeRequest<Monitor>(`/api/monitors/${id}`);
      
      if (!result.ok) {
        return {
          ok: false,
          error: result.error || 'Failed to fetch monitor'
        };
      }

      return {
        ok: true,
        data: this.mapApiMonitorToMonitor(result.data!)
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
      const apiData = {
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

      const result = await this.makeRequest<Monitor>('/api/monitors', {
        method: 'POST',
        body: JSON.stringify(apiData),
      });
      
      if (!result.ok) {
        return {
          ok: false,
          error: result.error || 'Failed to create monitor'
        };
      }

      return {
        ok: true,
        data: this.mapApiMonitorToMonitor(result.data!)
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
      const result = await this.makeRequest<boolean>(`/api/monitors/${id}`, {
        method: 'DELETE',
      });
      
      return {
        ok: result.ok,
        data: result.ok,
        error: result.error
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
      const result = await this.makeRequest<MonitorMetrics>(`/api/monitors/${id}/metrics?range=${range}`);
      
      if (!result.ok) {
        return {
          ok: false,
          error: result.error || 'Failed to get metrics'
        };
      }

      return {
        ok: true,
        data: result.data!
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
      const result = await this.authenticate();
      return {
        ok: result,
        data: result,
        error: result ? undefined : 'Authentication failed'
      };
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Map API monitor data to our Monitor interface
   */
  private mapApiMonitorToMonitor(apiMonitor: any): Monitor {
    const statusMap: Record<number, MonitorStatus> = {
      0: 'down',
      1: 'up',
      2: 'pending',
      3: 'maintenance'
    };

    return {
      id: apiMonitor.id,
      name: apiMonitor.name,
      url: apiMonitor.url,
      type: apiMonitor.type as MonitorType,
      status: statusMap[apiMonitor.status] || 'pending',
      interval: apiMonitor.interval || 300,
      uptime: apiMonitor.uptime || 0,
      avgResponseTime: apiMonitor.avgPing || 0,
      lastCheck: apiMonitor.lastCheck || new Date().toISOString(),
      createdAt: apiMonitor.createdDate || new Date().toISOString(),
      updatedAt: apiMonitor.updatedDate || new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const httpKumaClient = new HttpKumaClient();
