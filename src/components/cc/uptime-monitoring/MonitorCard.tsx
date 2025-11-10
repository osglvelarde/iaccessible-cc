"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UptimeStatusBadge } from "./UptimeStatusBadge";
import { UptimeKumaMonitor, getMonitorBeats, MonitorBeat } from "@/lib/uptime-kuma-api";
import { useHeartbeats } from "@/hooks/useHeartbeats";
import { ExternalLink, Clock, Activity, TrendingUp, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MonitorCardProps {
  monitor: UptimeKumaMonitor;
  className?: string;
  onViewDetails?: (monitor: UptimeKumaMonitor) => void;
}

export function MonitorCard({ monitor, className, onViewDetails }: MonitorCardProps) {
  const [initialBeats, setInitialBeats] = useState<MonitorBeat[]>([]);

  // Real-time heartbeat subscription
  const { heartbeats, latestHeartbeat, isConnected } = useHeartbeats({
    monitorId: monitor.id,
    enabled: true,
  });

  // Load initial heartbeat data for accurate average calculation
  useEffect(() => {
    let mounted = true;
    
    // Stagger requests to avoid overwhelming the server
    // Each monitor waits a bit based on its ID to spread out the load
    const delay = (monitor.id % 5) * 200; // 0-800ms delay based on monitor ID
    
    const timeoutId = setTimeout(() => {
      if (!mounted) return;
      
      getMonitorBeats(monitor.id, 1)
        .then((beats) => {
          if (mounted) {
            setInitialBeats(beats);
          }
        })
        .catch((error) => {
          // Only log non-timeout errors to reduce console noise
          // Timeout errors are expected when Uptime Kuma is slow/unavailable
          if (error instanceof Error && !error.message.includes('timed out')) {
            console.error(`Failed to load initial beats for monitor ${monitor.id}:`, error);
          } else {
            // Use debug level for expected timeout errors
            console.debug(`Monitor ${monitor.id}: Beat data unavailable (timeout or service unavailable)`);
          }
        });
    }, delay);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [monitor.id]);

  // Use latest heartbeat for real-time status if available
  const currentStatus: UptimeKumaMonitor['status'] = latestHeartbeat 
    ? (latestHeartbeat.status as 0 | 1 | 2)
    : monitor.status;

  // Combine initial beats with real-time heartbeats
  const allBeats = [...initialBeats, ...heartbeats].filter((beat, index, self) => {
    // Deduplicate by time and monitor_id
    return index === self.findIndex((b) => b.id === beat.id || (b.time === beat.time && b.monitor_id === beat.monitor_id));
  });

  // Calculate average response time from last hour of heartbeats
  const averageResponseTime = (() => {
    // Use combined heartbeats (initial + real-time) for calculation
    if (allBeats && allBeats.length > 0) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentBeats = allBeats.filter((beat) => {
        try {
          const beatTime = new Date(beat.time).getTime();
          return beatTime > oneHourAgo && beat.ping > 0 && !isNaN(beat.ping);
        } catch {
          return false;
        }
      });

      if (recentBeats.length > 0) {
        const sum = recentBeats.reduce((acc, beat) => acc + beat.ping, 0);
        return sum / recentBeats.length;
      }
    }

    // Fallback to monitor's avgResponseTime if available
    return monitor.avgResponseTime;
  })();
  
  // Parse last update time from heartbeat, handling various formats
  const lastUpdateTime = (() => {
    if (!latestHeartbeat?.time) return monitor.lastCheckTime;
    try {
      let parsed: number;
      const timeStr = String(latestHeartbeat.time).trim();
      
      // Try to parse as number first (Unix timestamp)
      const numTime = Number(timeStr);
      if (!isNaN(numTime) && numTime > 0) {
        // If it's a reasonable timestamp in seconds (before year 2100), convert to milliseconds
        if (numTime < 4102444800) { // Year 2100 in seconds
          parsed = numTime * 1000;
        } else {
          // Already in milliseconds
          parsed = numTime;
        }
      } else {
        // Try parsing as date string
        parsed = new Date(timeStr).getTime();
      }
      
      // Validate the parsed time
      if (isNaN(parsed) || parsed <= 0) {
        return monitor.lastCheckTime;
      }
      
      // Check if time is in the future (more than 1 minute) or too far in the past (more than 7 days)
      const now = Date.now();
      const diff = now - parsed;
      if (diff < -60000 || diff > 7 * 24 * 60 * 60 * 1000) {
        return monitor.lastCheckTime;
      }
      
      return parsed;
    } catch {
      return monitor.lastCheckTime;
    }
  })();

  const formatResponseTime = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatLastCheck = (timestamp?: number) => {
    if (!timestamp) return "Never";
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm");
    } catch {
      return "Unknown";
    }
  };

  const formatLastUpdate = (timestamp?: number) => {
    if (!timestamp || timestamp <= 0) return null;
    try {
      const now = Date.now();
      const diff = now - timestamp;
      
      // If timestamp is in the future or difference is too large (likely invalid), return null
      if (diff < 0 || diff > 86400000) { // More than 24 hours in the past or negative
        return null;
      }
      
      const seconds = Math.floor(diff / 1000);
      
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      return format(new Date(timestamp), "HH:mm");
    } catch {
      return null;
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="truncate">{monitor.name}</span>
              <UptimeStatusBadge status={currentStatus} />
              {isConnected && (
                <span 
                  className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" 
                  title="Real-time monitoring active"
                />
              )}
            </CardTitle>
          </div>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(monitor)}
              className="shrink-0"
            >
              View Details
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* URL */}
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate flex-1 min-w-0"
          >
            {monitor.url}
          </a>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Uptime Percentage */}
          {monitor.uptime !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="text-sm font-medium">
                  {monitor.uptime.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Average Response Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {latestHeartbeat || (heartbeats && heartbeats.length > 0) ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Avg Response Time
                  </>
                ) : (
                  "Avg Response Time"
                )}
              </div>
              <div className="text-sm font-medium">
                {formatResponseTime(averageResponseTime)}
              </div>
            </div>
          </div>

          {/* Monitor Type */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Type</div>
              <div className="text-sm font-medium uppercase">{monitor.type}</div>
            </div>
          </div>

          {/* SSL Certificate (for HTTPS) */}
          {monitor.certDaysRemaining !== undefined && monitor.type === 'https' && (
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 shrink-0 ${
                monitor.certDaysRemaining < 30 
                  ? 'text-red-500' 
                  : monitor.certDaysRemaining < 60 
                    ? 'text-yellow-500' 
                    : 'text-green-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">SSL Cert</div>
                <div className={`text-sm font-medium ${
                  monitor.certDaysRemaining < 30 
                    ? 'text-red-600' 
                    : monitor.certDaysRemaining < 60 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                }`}>
                  {Math.round(monitor.certDaysRemaining)} days
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Message (if down or error) */}
        {monitor.statusMessage && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-300">{monitor.statusMessage}</div>
          </div>
        )}

        {/* Last Check */}
        {(lastUpdateTime || monitor.lastCheckTime) && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {latestHeartbeat ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Last update: {formatLastUpdate(lastUpdateTime) || formatLastCheck(lastUpdateTime)}</span>
              </>
            ) : (
              <span>Last checked: {formatLastCheck(monitor.lastCheckTime)}</span>
            )}
          </div>
        )}
      </CardContent>

    </Card>
  );
}
