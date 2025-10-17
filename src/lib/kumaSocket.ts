/**
 * Uptime Kuma Socket.IO Client
 * 
 * This client handles Socket.IO communication with Uptime Kuma for monitor CRUD operations.
 * It uses the same Socket.IO events that the Uptime Kuma web UI uses internally.
 */

import { io, Socket } from 'socket.io-client';

// Server-side only - never import this in client components
if (typeof window !== 'undefined') {
  throw new Error('kumaSocket.ts is server-side only and cannot be imported in client components');
}

let socketPromise: Promise<Socket> | null = null;

/**
 * Connect to Uptime Kuma and authenticate
 */
async function connectAndLogin(): Promise<Socket> {
  const { KUMA_BASE_URL, KUMA_USERNAME, KUMA_PASSWORD, KUMA_2FA_TOKEN } = process.env;
  
  // Guard against missing credentials
  if (!KUMA_USERNAME || !KUMA_PASSWORD) {
    throw new Error('KUMA_USERNAME / KUMA_PASSWORD missing from environment variables');
  }

  console.log(`[Kuma] Connecting to Uptime Kuma at ${KUMA_BASE_URL}`);
  console.log(`[Kuma] Logging in as ${KUMA_USERNAME}`);

  const socket = io(KUMA_BASE_URL, {
    transports: ['websocket'], // Avoid long-polling in server context
    path: '/socket.io',
    timeout: 10000,
    reconnection: false, // Disable auto-reconnection for server-side
    forceNew: true,
  });

  // Wait for connection
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => {
      console.log('Connected to Uptime Kuma');
      resolve();
    });
    socket.once('connect_error', (error) => {
      console.error('Connection error:', error);
      reject(error);
    });
  });

  // Authenticate after connection
  await new Promise<void>((resolve, reject) => {
    socket.emit('login', {
      username: KUMA_USERNAME,
      password: KUMA_PASSWORD,
      token: KUMA_2FA_TOKEN || undefined, // Only if 2FA enabled
    }, (res: any) => {
      if (res?.ok || res === true) {
        console.log('Authenticated with Uptime Kuma');
        resolve();
      } else {
        let errorMessage = res?.msg || 'Kuma login failed';
        
        // Provide more helpful error messages
        if (errorMessage.includes('Incorrect username or password')) {
          errorMessage = 'Authentication failed. Please check your Uptime Kuma credentials in .env.local. Make sure you have created an account at http://localhost:3001 first.';
        }
        
        const error = new Error(errorMessage);
        console.error('Authentication failed:', error.message);
        reject(error);
      }
    });
  });

  return socket;
}

/**
 * Get authenticated Socket.IO connection
 */
export async function getSocket(): Promise<Socket> {
  if (!socketPromise) {
    socketPromise = connectAndLogin();
  }
  
  try {
    return await socketPromise;
  } catch (error) {
    // Reset promise on error so next call will retry
    socketPromise = null;
    throw error;
  }
}

/**
 * Get all monitors
 */
export async function getMonitors(): Promise<any[]> {
  const socket = await getSocket();
  
  return new Promise<any[]>((resolve, reject) => {
    socket.emit('getMonitors', null, (res: any) => {
      if (res?.ok) {
        resolve(res.data || res.monitors || []);
      } else if (Array.isArray(res)) {
        // Some versions return array directly
        resolve(res);
      } else {
        reject(new Error(res?.msg || 'Failed to get monitors'));
      }
    });
  });
}

/**
 * Get single monitor
 */
export async function getMonitor(id: number): Promise<any> {
  const socket = await getSocket();
  
  return new Promise<any>((resolve, reject) => {
    socket.emit('getMonitor', { id }, (res: any) => {
      if (res?.ok) {
        resolve(res.data || res.monitor);
      } else {
        reject(new Error(res?.msg || 'Failed to get monitor'));
      }
    });
  });
}

/**
 * Create new monitor
 */
export async function createMonitor(monitorData: any): Promise<any> {
  const socket = await getSocket();
  
  return new Promise<any>((resolve, reject) => {
    socket.emit('add', monitorData, (res: any) => {
      if (res?.ok) {
        resolve(res.data || res.monitor);
      } else {
        reject(new Error(res?.msg || 'Failed to create monitor'));
      }
    });
  });
}

/**
 * Delete monitor
 */
export async function deleteMonitor(id: number): Promise<boolean> {
  const socket = await getSocket();
  
  return new Promise<boolean>((resolve, reject) => {
    socket.emit('deleteMonitor', id, (res: any) => {
      if (res?.ok) {
        resolve(true);
      } else {
        reject(new Error(res?.msg || 'Failed to delete monitor'));
      }
    });
  });
}

/**
 * Get monitor metrics/chart data
 */
export async function getMonitorMetrics(id: number, period: number = 24): Promise<any> {
  const socket = await getSocket();
  
  return new Promise<any>((resolve, reject) => {
    socket.emit('getMonitorChartData', { monitorID: id, period }, (res: any) => {
      if (res?.ok) {
        resolve(res.data);
      } else {
        reject(new Error(res?.msg || 'Failed to get metrics'));
      }
    });
  });
}

/**
 * Test connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getSocket();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Close connection
 */
export function closeConnection(): void {
  if (socketPromise) {
    socketPromise.then(socket => {
      socket.disconnect();
    });
    socketPromise = null;
  }
}
