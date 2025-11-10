"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { HeartbeatEvent } from '@/lib/uptime-kuma-socket';
import { MonitorBeat } from '@/lib/uptime-kuma-api';

export interface UseHeartbeatsOptions {
  monitorId: number;
  enabled?: boolean;
  onHeartbeat?: (heartbeat: HeartbeatEvent) => void;
}

export interface UseHeartbeatsReturn {
  heartbeats: MonitorBeat[];
  latestHeartbeat: HeartbeatEvent | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

/**
 * React hook for subscribing to real-time heartbeat events from Uptime Kuma
 * 
 * @param options Configuration options
 * @returns Heartbeat data and connection status
 */
export function useHeartbeats({
  monitorId,
  enabled = true,
  onHeartbeat,
}: UseHeartbeatsOptions): UseHeartbeatsReturn {
  const [heartbeats, setHeartbeats] = useState<MonitorBeat[]>([]);
  const [latestHeartbeat, setLatestHeartbeat] = useState<HeartbeatEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !monitorId) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create EventSource for SSE connection
      const eventSource = new EventSource(
        `/api/uptime-kuma/heartbeats?monitorId=${monitorId}`
      );

      eventSource.onopen = () => {
        console.log(`[useHeartbeats] Connected for monitor ${monitorId}`);
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            setIsConnected(true);
            setError(null);
          } else if (data.type === 'heartbeat') {
            const heartbeat: HeartbeatEvent = data.data;
            
            // Update latest heartbeat
            setLatestHeartbeat(heartbeat);

            // Convert to MonitorBeat format and add to array
            const beat: MonitorBeat = {
              id: heartbeat.monitorID * 1000000 + Date.now(), // Generate unique ID
              monitor_id: heartbeat.monitorID,
              status: heartbeat.status as 0 | 1 | 2,
              ping: heartbeat.ping || 0,
              msg: heartbeat.msg || '',
              time: heartbeat.time || new Date().toISOString(),
              duration: heartbeat.duration || 0,
              important: heartbeat.important || false,
              down_count: heartbeat.down_count || 0,
            };

            // Add to heartbeats array (keep last hour of data)
            setHeartbeats((prev) => {
              const now = Date.now();
              const oneHourAgo = now - 60 * 60 * 1000;
              
              // Filter out old heartbeats and add new one
              const filtered = prev.filter((h) => {
                const beatTime = new Date(h.time).getTime();
                return beatTime > oneHourAgo;
              });

              // Add new heartbeat at the beginning
              return [beat, ...filtered].slice(0, 100); // Keep max 100 beats
            });

            // Call optional callback
            if (onHeartbeat) {
              onHeartbeat(heartbeat);
            }
          } else if (data.type === 'status') {
            setIsConnected(data.status?.connected || false);
          } else if (data.type === 'error') {
            setError(data.error || 'Unknown error');
            setIsConnected(false);
          } else if (data.type === 'ping') {
            // Keep-alive ping, no action needed
          }
        } catch (parseError) {
          console.error('[useHeartbeats] Error parsing SSE message:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[useHeartbeats] SSE error for monitor ${monitorId}:`, error);
        setIsConnected(false);
        
        // Attempt to reconnect after a delay
        if (eventSource.readyState === EventSource.CLOSED) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error(`[useHeartbeats] Failed to create EventSource:`, err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [monitorId, enabled, onHeartbeat]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  useEffect(() => {
    if (enabled && monitorId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, monitorId, connect, disconnect]);

  return {
    heartbeats,
    latestHeartbeat,
    isConnected,
    error,
    reconnect,
  };
}



