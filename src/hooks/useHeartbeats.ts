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
            
            console.log(`[useHeartbeats] Received heartbeat for monitor ${monitorId}:`, {
              monitorID: heartbeat.monitorID,
              status: heartbeat.status,
              ping: heartbeat.ping,
              time: heartbeat.time,
            });
            
            // Update latest heartbeat
            setLatestHeartbeat(heartbeat);

            // Parse time - handle different formats
            let parsedTime: string;
            try {
              // Try parsing the time string
              const timeStr = heartbeat.time || new Date().toISOString();
              // Handle format like '2025-11-10 17:35:46.179' by converting to ISO format
              if (typeof timeStr === 'string' && timeStr.includes(' ') && !timeStr.includes('T')) {
                // Convert 'YYYY-MM-DD HH:mm:ss.SSS' to ISO format
                parsedTime = timeStr.replace(' ', 'T') + 'Z';
              } else {
                parsedTime = timeStr;
              }
              // Validate the date
              const testDate = new Date(parsedTime);
              if (isNaN(testDate.getTime())) {
                // If parsing failed, use current time
                parsedTime = new Date().toISOString();
              }
            } catch {
              parsedTime = new Date().toISOString();
            }

            // Convert to MonitorBeat format and add to array
            const beat: MonitorBeat = {
              id: heartbeat.monitorID * 1000000 + Date.now(), // Generate unique ID
              monitor_id: heartbeat.monitorID,
              status: heartbeat.status as 0 | 1 | 2,
              ping: heartbeat.ping !== undefined && heartbeat.ping !== null ? heartbeat.ping : 0,
              msg: heartbeat.msg || '',
              time: parsedTime,
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
                try {
                  const beatTime = new Date(h.time).getTime();
                  return beatTime > oneHourAgo && !isNaN(beatTime);
                } catch {
                  return false;
                }
              });

              // Check if this heartbeat already exists (deduplicate by time)
              const beatTime = new Date(beat.time).getTime();
              const isDuplicate = filtered.some((h) => {
                try {
                  const hTime = new Date(h.time).getTime();
                  // Consider it a duplicate if within 1 second
                  return Math.abs(hTime - beatTime) < 1000;
                } catch {
                  return false;
                }
              });

              if (isDuplicate) {
                console.log(`[useHeartbeats] Skipping duplicate heartbeat for monitor ${monitorId} at ${beat.time}`);
                return filtered;
              }

              // Add new heartbeat at the beginning
              const updated = [beat, ...filtered].slice(0, 100); // Keep max 100 beats
              console.log(`[useHeartbeats] Monitor ${monitorId} now has ${updated.length} heartbeats in array (added new, filtered ${prev.length - filtered.length} old)`);
              return updated;
            });

            // Call optional callback
            if (onHeartbeat) {
              onHeartbeat(heartbeat);
            }
          } else if (data.type === 'status') {
            // Handle status update - data.status is an object with connected/authenticated
            if (data.status && typeof data.status === 'object') {
              setIsConnected(data.status.connected || false);
            }
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
        // Only log if it's a real error (not just connection state changes)
        // EventSource fires onerror for various reasons, including normal reconnections
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection is closed - attempt to reconnect
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          // Still connecting - this is normal, don't log as error
          setIsConnected(false);
        }
        // EventSource.CONNECTED state doesn't trigger onerror, so we don't need to handle it
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



