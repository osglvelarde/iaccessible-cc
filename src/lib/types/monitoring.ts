export type MonitorStatus = 'up' | 'down' | 'pending' | 'maintenance';

export type MonitorType = 'http' | 'https' | 'ping' | 'tcp' | 'dns';

export type MonitorInterval = 60 | 300 | 600 | 1800 | 3600; // seconds

export interface Monitor {
  id: number;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  interval: MonitorInterval;
  uptime: number; // percentage
  avgResponseTime: number; // milliseconds
  lastCheck: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface MonitorMetrics {
  monitorId: number;
  uptime: number; // percentage
  avgResponseTime: number; // milliseconds
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  dataPoints: Array<{
    timestamp: string; // ISO timestamp
    responseTime: number; // milliseconds
    status: MonitorStatus;
  }>;
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  type?: MonitorType;
  interval?: MonitorInterval;
}

export interface UpdateMonitorRequest {
  name?: string;
  url?: string;
  type?: MonitorType;
  interval?: MonitorInterval;
}

export interface MonitorListResponse {
  monitors: Monitor[];
  total: number;
}

export interface MonitorMetricsResponse {
  metrics: MonitorMetrics;
  range: string; // 24h, 7d, 30d
}

export interface KumaApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Uptime Kuma API specific types
export interface KumaMonitor {
  id: number;
  name: string;
  url: string;
  type: string;
  status: number; // 0=up, 1=down, 2=pending, 3=maintenance
  uptime: number;
  avgResponseTime: number;
  lastCheck: number; // Unix timestamp
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export interface KumaCreateMonitorRequest {
  name: string;
  url: string;
  type?: string;
  interval?: number;
}

export interface KumaMetricsData {
  monitorId: number;
  uptime: number;
  avgResponseTime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  dataPoints: Array<{
    timestamp: number; // Unix timestamp
    responseTime: number;
    status: number;
  }>;
}
