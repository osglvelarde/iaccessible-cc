// Uptime Kuma API Client (via Next.js API routes)
// Monitor management uses Python scripts with uptime-kuma-api wrapper

// Use relative URL for client-side, absolute for server-side
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL
    return '/api/uptime-kuma';
  }
  // Server-side: use absolute URL
  return process.env.NODE_ENV === 'production' 
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/uptime-kuma`
    : 'http://localhost:3000/api/uptime-kuma';
};

export type UptimeStatus = 0 | 1 | 2; // 0 = down, 1 = up, 2 = pending

export interface UptimeKumaHeartbeat {
  monitorID: number;
  status: UptimeStatus;
  msg: string;
  time: number; // unix timestamp (ms)
  duration?: number; // ms
}

export interface UptimeKumaMonitor {
  id: number;
  name: string;
  url: string;
  type: 'http' | 'https' | 'tcp' | 'ping' | 'dns';
  status: UptimeStatus;
  uptime?: number; // Uptime percentage (0-100)
  avgResponseTime?: number; // Average response time in ms
  maxResponseTime?: number; // Maximum response time in ms
  minResponseTime?: number; // Minimum response time in ms
  lastCheckTime?: number; // Unix timestamp (ms)
  certDaysRemaining?: number; // SSL certificate days remaining (for HTTPS)
  statusMessage?: string; // Status message/error if any
  heartbeat?: UptimeKumaHeartbeat;
}

export interface UptimeKumaStatusSummary {
  status: 'ok' | 'error';
  totalMonitors?: number;
  upMonitors?: number;
  downMonitors?: number;
  pendingMonitors?: number;
}

/**
 * Monitor heartbeat/beat data from Uptime Kuma
 * Based on get_monitor_beats() API response
 */
export interface MonitorBeat {
  id: number;
  monitor_id: number;
  status: UptimeStatus;
  ping: number; // Response time in milliseconds
  msg: string; // Status message
  time: string; // Timestamp string (e.g., '2022-12-15 12:38:42.661')
  duration: number; // Duration since last heartbeat in seconds
  important: boolean; // Whether this is an important heartbeat
  down_count: number; // Count of consecutive down events
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data && (data as any).error) {
        message = (data as any).error as string;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  
  // For metrics endpoint, return text; for others, return JSON
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/plain') || contentType.includes('text/plain;')) {
    return response.text() as T;
  }
  
  return response.json();
}

/**
 * Get metrics from Uptime Kuma (Prometheus format)
 * This is the main REST endpoint available for getting monitor data
 */
export async function getMetrics(): Promise<string> {
  const url = `${getApiBase()}/metrics`;
  const response = await fetch(url);
  return handleApiResponse<string>(response);
}

/**
 * Parse Prometheus metrics to extract monitor information
 * Extracts all available metrics from Uptime Kuma's Prometheus format
 */
export function parseMetricsToMonitors(metrics: string): UptimeKumaMonitor[] {
  const monitors: Map<number, UptimeKumaMonitor> = new Map();
  
  const lines = metrics.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    // Parse monitor_status
    if (trimmedLine.startsWith('monitor_status{')) {
      const match = trimmedLine.match(/monitor_id="(\d+)",monitor_name="([^"]+)",monitor_type="([^"]+)",monitor_url="([^"]+)"/);
      if (match) {
        const [, id, name, type, url] = match;
        const status = parseInt(trimmedLine.split(' ').pop() || '0') as UptimeStatus;
        
        monitors.set(parseInt(id), {
          id: parseInt(id),
          name: name || 'Unknown',
          url: url || '',
          type: type as any,
          status,
          uptime: undefined,
          avgResponseTime: undefined,
          maxResponseTime: undefined,
          minResponseTime: undefined,
          lastCheckTime: undefined,
          certDaysRemaining: undefined,
          statusMessage: undefined,
          heartbeat: undefined
        });
      }
    }
    // Parse monitor_response_time (average)
    else if (trimmedLine.startsWith('monitor_response_time{')) {
      const match = trimmedLine.match(/monitor_id="(\d+)"/);
      if (match) {
        const id = parseInt(match[1]);
        const responseTime = parseFloat(trimmedLine.split(' ').pop() || '0');
        const monitor = monitors.get(id);
        if (monitor) {
          monitor.avgResponseTime = responseTime;
        }
      }
    }
    // Parse monitor_uptime (percentage)
    else if (trimmedLine.startsWith('monitor_uptime{')) {
      const match = trimmedLine.match(/monitor_id="(\d+)"/);
      if (match) {
        const id = parseInt(match[1]);
        const uptime = parseFloat(trimmedLine.split(' ').pop() || '0');
        const monitor = monitors.get(id);
        if (monitor) {
          monitor.uptime = uptime;
        }
      }
    }
    // Parse cert_days_remaining (for HTTPS monitors)
    else if (trimmedLine.startsWith('cert_days_remaining{')) {
      const match = trimmedLine.match(/monitor_id="(\d+)"/);
      if (match) {
        const id = parseInt(match[1]);
        const days = parseFloat(trimmedLine.split(' ').pop() || '0');
        const monitor = monitors.get(id);
        if (monitor && days > 0) {
          monitor.certDaysRemaining = days;
        }
      }
    }
    // Parse monitor_last_check (timestamp)
    else if (trimmedLine.startsWith('monitor_last_check{')) {
      const match = trimmedLine.match(/monitor_id="(\d+)"/);
      if (match) {
        const id = parseInt(match[1]);
        const timestamp = parseFloat(trimmedLine.split(' ').pop() || '0');
        const monitor = monitors.get(id);
        if (monitor && timestamp > 0) {
          monitor.lastCheckTime = timestamp * 1000; // Convert seconds to milliseconds
        }
      }
    }
  }
  
  return Array.from(monitors.values());
}

/**
 * Get monitors by parsing metrics
 */
export async function getMonitors(): Promise<UptimeKumaMonitor[]> {
  const metrics = await getMetrics();
  return parseMetricsToMonitors(metrics);
}

/**
 * Get status page data (if any status pages are published)
 * This requires a published status page slug
 */
export async function getStatusPage(slug: string): Promise<any> {
  const response = await fetch(`${getApiBase()}/api/status-page/${slug}`);
  return handleApiResponse<any>(response);
}

/**
 * Get status page heartbeats and uptime data
 */
export async function getStatusPageHeartbeats(slug: string): Promise<any> {
  const response = await fetch(`${getApiBase()}/api/status-page/heartbeat/${slug}`);
  return handleApiResponse<any>(response);
}

/**
 * Get entry page info to determine available status pages
 */
export async function getEntryPage(): Promise<any> {
  const response = await fetch(`${getApiBase()}/api/entry-page`);
  return handleApiResponse<any>(response);
}

/**
 * Create a new monitor
 * Uses Python scripts with uptime-kuma-api wrapper via Next.js API route
 */
export async function createMonitor(data: {
  name: string;
  url: string;
  type: string;
  heartbeatInterval?: number;
  retries?: number;
  retryInterval?: number;
  timeout?: number;
  method?: string;
  body?: string;
  bodyEncoding?: string;
  httpMethod?: string;
  heartbeatRetryInterval?: number;
  requestTimeout?: number;
}): Promise<UptimeKumaMonitor> {
  try {
    const response = await fetch(`${getApiBase()}/monitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Read response body as text first (can only be read once)
    const responseText = await response.text();
    
    if (!response || !response.ok) {
      const status = response?.status || 0;
      let errorMessage = `HTTP ${status}: Failed to create monitor`;
      
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          if (errorData && typeof errorData === 'object') {
            // Extract error message from response - check common error fields
            errorMessage = errorData.error || errorData.message || errorData.msg || errorMessage;
            // Include details if available
            if (errorData.details && typeof errorData.details === 'object') {
              errorMessage += `: ${JSON.stringify(errorData.details)}`;
            }
          }
        } catch {
          // If JSON parsing fails, use response text or status text
          errorMessage = responseText || response?.statusText || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }

    // Parse successful response
    let result;
    try {
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid response format from server');
    }
    
    if (!result || result.success === false) {
      const errorMsg = result?.error || result?.message || 'Failed to create monitor';
      throw new Error(errorMsg);
    }

    // Return a monitor object with the new ID
    return {
      id: result.monitorID,
      name: data.name,
      url: data.url,
      type: data.type as any,
      status: 2, // Pending
    };
  } catch (error) {
    // Re-throw if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(`Failed to create monitor: ${String(error)}`);
  }
}

/**
 * Update an existing monitor
 */
export async function updateMonitor(
  id: number,
  data: Partial<UptimeKumaMonitor> & {
    heartbeatInterval?: number;
    retries?: number;
    heartbeatRetryInterval?: number;
    requestTimeout?: number;
    httpMethod?: string;
    method?: string;
    body?: string;
    bodyEncoding?: string;
  }
): Promise<UptimeKumaMonitor> {
  const response = await fetch(`${getApiBase()}/monitors?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, id }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: Failed to update monitor`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData === 'object') {
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('Invalid response from server');
  }
  
  if (!result || !result.success) {
    const errorMsg = result?.error || result?.message || 'Failed to update monitor';
    throw new Error(errorMsg);
  }

  // Return updated monitor data
  return {
    id,
    name: data.name || '',
    url: data.url || '',
    type: (data.type || 'https') as any,
    status: data.status || 0,
  };
}

/**
 * Delete a monitor
 * Uses Python scripts with uptime-kuma-api wrapper via Next.js API route
 */
export async function deleteMonitor(id: number): Promise<void> {
  try {
    const response = await fetch(`${getApiBase()}/monitors?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to delete monitor: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete monitor');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to delete monitor: ${String(error)}`);
  }
}

/**
 * Get monitor beats (heartbeat history) for a specific monitor
 * Uses Python script to fetch data via Socket.io
 * @param monitorId Monitor ID
 * @param hours Number of hours of history to fetch (default: 1 for last hour)
 * @returns Array of MonitorBeat objects
 */
export async function getMonitorBeats(monitorId: number, hours: number = 1): Promise<MonitorBeat[]> {
  try {
    // Create an AbortController for timeout
    // Python script has 60s timeout, so we need at least 65s to allow for processing overhead
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`[getMonitorBeats] Request timeout for monitor ${monitorId} after 65 seconds`);
    }, 65000); // 65 second timeout (5s buffer after Python's 60s timeout)

    let result: any;
    try {
      console.log(`[getMonitorBeats] Fetching beats for monitor ${monitorId} (${hours} hour(s))`);
      const startTime = Date.now();
      
      const response = await fetch(`${getApiBase()}/monitor-beats?id=${monitorId}&hours=${hours}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;
      clearTimeout(timeoutId);
      console.log(`[getMonitorBeats] Received response for monitor ${monitorId} in ${duration}ms`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const errorMsg = errorData.error || `Failed to fetch monitor beats: ${response.statusText}`;
        console.error(`[getMonitorBeats] Error response for monitor ${monitorId}:`, errorMsg);
        throw new Error(errorMsg);
      }

      result = await response.json();
      if (result.success === false) {
        const errorMsg = result.error || 'Failed to fetch monitor beats';
        console.error(`[getMonitorBeats] Script returned error for monitor ${monitorId}:`, errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log(`[getMonitorBeats] Successfully fetched ${result.beats?.length || 0} beats for monitor ${monitorId}`);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        const errorMsg = `Request timed out after 65 seconds. The Python script may be taking longer than expected to connect to Uptime Kuma. This is normal if Uptime Kuma is slow to respond. Real-time heartbeats will still work. Please check if Uptime Kuma is running and accessible at ${process.env.UPTIME_KUMA_API_URL || 'http://localhost:3003'}`;
        console.error(`[getMonitorBeats] Timeout for monitor ${monitorId}:`, errorMsg);
        throw new Error(errorMsg);
      }
      console.error(`[getMonitorBeats] Fetch error for monitor ${monitorId}:`, fetchError);
      throw fetchError;
    }

    // Parse and normalize the beats data
    // Handle MonitorStatus enum objects from Python (they have .value property)
    const beats: MonitorBeat[] = (result.beats || []).map((beat: any) => {
      // Extract status value - handle both enum objects and raw numbers
      let statusValue: number;
      if (beat.status && typeof beat.status === 'object' && 'value' in beat.status) {
        // Python MonitorStatus enum object
        statusValue = beat.status.value;
      } else if (typeof beat.status === 'number') {
        statusValue = beat.status;
      } else {
        // Default to pending if unknown
        statusValue = 2;
      }
      
      // Normalize status: 0 = down, 1 = up, 2 = pending
      const normalizedStatus = statusValue === 1 ? 1 : statusValue === 0 ? 0 : 2;
      
      return {
        id: beat.id,
        monitor_id: beat.monitor_id || beat.monitorID,
        status: normalizedStatus,
        ping: beat.ping || 0,
        msg: beat.msg || '',
        time: beat.time || '',
        duration: beat.duration || 0,
        important: beat.important || false,
        down_count: beat.down_count || 0,
      };
    });

    return beats;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to get monitor beats: ${String(error)}`);
  }
}


