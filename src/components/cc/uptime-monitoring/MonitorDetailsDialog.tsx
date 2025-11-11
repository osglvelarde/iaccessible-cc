"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UptimeStatusBadge } from "./UptimeStatusBadge";
import { HeartbeatChart } from "./HeartbeatChart";
import { UptimeKumaMonitor, getMonitorBeats, MonitorBeat } from "@/lib/uptime-kuma-api";
import { useHeartbeats } from "@/hooks/useHeartbeats";
import {
  ExternalLink,
  Clock,
  Activity,
  Globe,
  TrendingUp,
  Shield,
  X,
  Loader2,
  AlertCircle,
  List,
} from "lucide-react";
import { format } from "date-fns";

interface MonitorDetailsDialogProps {
  monitor: UptimeKumaMonitor | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (monitor: UptimeKumaMonitor) => void;
}

export function MonitorDetailsDialog({
  monitor,
  open,
  onClose,
  onEdit,
}: MonitorDetailsDialogProps) {
  const [initialBeats, setInitialBeats] = useState<MonitorBeat[]>([]);
  const [loadingBeats, setLoadingBeats] = useState(false);
  const [beatsError, setBeatsError] = useState<string | null>(null);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);

  // Real-time heartbeat subscription
  const { heartbeats, latestHeartbeat, isConnected, error: heartbeatError } = useHeartbeats({
    monitorId: monitor?.id || 0,
    enabled: open && !!monitor,
  });

  // Load initial heartbeat data when dialog opens
  useEffect(() => {
    if (open && monitor) {
      setLoadingBeats(true);
      setBeatsError(null);
      
      let isCancelled = false;
      
      // Add a safety timeout to ensure loading state doesn't hang forever
      const safetyTimeout = setTimeout(() => {
        if (!isCancelled) {
          setLoadingBeats(false);
          setBeatsError("Request is taking longer than expected. The Uptime Kuma service may be unavailable.");
        }
      }, 20000); // 20 second safety timeout

      getMonitorBeats(monitor.id, 1)
        .then((beats) => {
          if (!isCancelled) {
            clearTimeout(safetyTimeout);
            setInitialBeats(beats);
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            clearTimeout(safetyTimeout);
            // Only log non-timeout errors to reduce console noise
            if (error instanceof Error && !error.message.includes('timed out')) {
              console.error("Failed to load initial beats:", error);
            } else {
              console.debug("Beat data unavailable (timeout or service unavailable)");
            }
            const errorMessage = error instanceof Error 
              ? error.message 
              : "Failed to load heartbeat data";
            setBeatsError(errorMessage);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            clearTimeout(safetyTimeout);
            setLoadingBeats(false);
          }
        });

      // Cleanup function
      return () => {
        isCancelled = true;
        clearTimeout(safetyTimeout);
      };
    } else {
      setInitialBeats([]);
      setLoadingBeats(false);
      setBeatsError(null);
    }
  }, [open, monitor]);

  // Combine initial beats with real-time heartbeats
  const allBeats = [...initialBeats, ...heartbeats].filter((beat, index, self) => {
    // Deduplicate by time and monitor_id
    return index === self.findIndex((b) => b.id === beat.id || (b.time === beat.time && b.monitor_id === beat.monitor_id));
  });

  // Debug logging
  useEffect(() => {
    if (open && monitor) {
      console.log(`[MonitorDetailsDialog] Monitor ${monitor.id} - Initial beats: ${initialBeats.length}, Real-time heartbeats: ${heartbeats.length}, All beats: ${allBeats.length}`);
      if (allBeats.length > 0) {
        console.log(`[MonitorDetailsDialog] Sample beat:`, allBeats[0]);
      }
    }
  }, [open, monitor, initialBeats.length, heartbeats.length, allBeats.length]);

  if (!monitor) return null;

  const formatResponseTime = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Never";
    try {
      return format(new Date(timestamp), "PPpp");
    } catch {
      return "Unknown";
    }
  };

  // Helper to parse heartbeat time string to milliseconds timestamp
  const parseHeartbeatTime = (timeStr?: string | number): number | null => {
    if (!timeStr) return null;
    try {
      let parsed: number;
      const timeString = String(timeStr).trim();
      
      // Try to parse as number first (Unix timestamp)
      const numTime = Number(timeString);
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
        parsed = new Date(timeString).getTime();
      }
      
      // Validate the parsed time
      if (isNaN(parsed) || parsed <= 0) {
        return null;
      }
      
      // Check if time is in the future (more than 1 minute) or too far in the past (more than 7 days)
      const now = Date.now();
      const diff = now - parsed;
      if (diff < -60000 || diff > 7 * 24 * 60 * 60 * 1000) {
        return null;
      }
      
      return parsed;
    } catch {
      return null;
    }
  };

  const calculateUptime = () => {
    if (!monitor.uptime) return "N/A";
    return `${monitor.uptime.toFixed(2)}%`;
  };

  // Use latest heartbeat for real-time status if available
  const currentStatus: UptimeKumaMonitor['status'] = latestHeartbeat 
    ? (latestHeartbeat.status as 0 | 1 | 2)
    : monitor.status;
  const currentResponseTime = latestHeartbeat ? latestHeartbeat.ping : monitor.avgResponseTime;
  
  // Parse latest heartbeat time safely
  const latestHeartbeatTime = latestHeartbeat ? parseHeartbeatTime(latestHeartbeat.time) : null;
  
  // Calculate response time stats from heartbeat history if monitor stats are missing
  const calculatedStats = (() => {
    if (allBeats.length === 0) return null;
    
    const responseTimes = allBeats
      .map(b => b.ping)
      .filter(p => p > 0 && !isNaN(p));
    
    if (responseTimes.length === 0) return null;
    
    return {
      avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
    };
  })();
  
  // Use calculated stats if monitor stats are missing
  const displayAvgResponseTime = monitor.avgResponseTime ?? calculatedStats?.avg;
  const displayMaxResponseTime = monitor.maxResponseTime ?? calculatedStats?.max;
  const displayMinResponseTime = monitor.minResponseTime ?? calculatedStats?.min;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {monitor.name}
                <UptimeStatusBadge status={currentStatus} />
                {isConnected && (
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Real-time connected" />
                )}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Monitor ID: {monitor.id} • Type: {monitor.type.toUpperCase()}
                {latestHeartbeatTime && (
                  <span className="ml-2 text-xs" title={formatTimestamp(latestHeartbeatTime)}>
                    • Last update: {format(new Date(latestHeartbeatTime), "HH:mm:ss")}
                  </span>
                )}
                {!latestHeartbeatTime && monitor.lastCheckTime && (
                  <span className="ml-2 text-xs" title={formatTimestamp(monitor.lastCheckTime)}>
                    • Last check: {format(new Date(monitor.lastCheckTime), "HH:mm:ss")}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                {monitor.url}
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>

          {/* Status Information */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      <UptimeStatusBadge status={currentStatus} />
                      {isConnected && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                  {monitor.uptime !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Uptime Percentage</div>
                      <div className="text-lg font-semibold">{calculateUptime()}</div>
                    </div>
                  )}
                  {monitor.certDaysRemaining !== undefined && monitor.type === 'https' && (
                    <div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        SSL Certificate
                      </div>
                      <div className={`text-lg font-semibold ${
                        monitor.certDaysRemaining < 30 
                          ? 'text-red-600 dark:text-red-400' 
                          : monitor.certDaysRemaining < 60 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-green-600 dark:text-green-400'
                      }`}>
                        {Math.round(monitor.certDaysRemaining)} days remaining
                      </div>
                    </div>
                  )}
                  {monitor.statusMessage && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Status Message</div>
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {monitor.statusMessage}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(currentResponseTime !== undefined || displayAvgResponseTime !== undefined) ? (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {latestHeartbeat ? "Current" : displayAvgResponseTime ? "Average" : "Latest"}
                        </div>
                        <div className="text-lg font-semibold">
                          {formatResponseTime(currentResponseTime || displayAvgResponseTime)}
                        </div>
                      </div>
                      {displayAvgResponseTime !== undefined && latestHeartbeat && (
                        <div>
                          <div className="text-xs text-muted-foreground">Average</div>
                          <div className="text-sm">{formatResponseTime(displayAvgResponseTime)}</div>
                        </div>
                      )}
                      {displayMaxResponseTime !== undefined && (
                        <div>
                          <div className="text-xs text-muted-foreground">Max</div>
                          <div className="text-sm">{formatResponseTime(displayMaxResponseTime)}</div>
                        </div>
                      )}
                      {displayMinResponseTime !== undefined && (
                        <div>
                          <div className="text-xs text-muted-foreground">Min</div>
                          <div className="text-sm">{formatResponseTime(displayMinResponseTime)}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No response time data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Heartbeat History Chart */}
          <div>
            {/* Connection Status Indicator - Only show when connected */}
            {isConnected && (
              <div className="mb-4 flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>
                    Connected to Uptime Kuma ({heartbeats.length} real-time heartbeats)
                  </span>
                </div>
                {latestHeartbeat && (
                  <span className="text-xs text-muted-foreground">
                    Last heartbeat: {format(new Date(latestHeartbeat.time), "HH:mm:ss")}
                  </span>
                )}
              </div>
            )}

            {loadingBeats && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading historical heartbeat data...</span>
                </CardContent>
              </Card>
            )}
            {beatsError && (
              <Card>
                <CardContent className="flex items-center gap-2 py-4 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Historical data unavailable: {beatsError}. 
                    {isConnected && heartbeats.length > 0 && ' Real-time heartbeats are working.'}
                  </span>
                </CardContent>
              </Card>
            )}
            {!loadingBeats && (
              <>
                <HeartbeatChart beats={allBeats} />
                {allBeats.length > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetailedHistory(!showDetailedHistory)}
                      className="w-full"
                    >
                      <List className="h-4 w-4 mr-2" />
                      {showDetailedHistory ? "Hide" : "Show"} Detailed Heartbeat History
                      {allBeats.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {allBeats.length} beats
                          {initialBeats.length > 0 && (
                            <span className="ml-1 text-xs">({initialBeats.length} historical, {heartbeats.length} real-time)</span>
                          )}
                        </Badge>
                      )}
                    </Button>
                  </div>
                )}
                {allBeats.length === 0 && !beatsError && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No heartbeat data available</p>
                      {!isConnected && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Waiting for connection to Uptime Kuma...
                        </p>
                      )}
                      {isConnected && heartbeats.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Waiting for heartbeat events from Uptime Kuma...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {/* Removed heartbeat error display - errors are handled silently */}
          </div>

          {/* Detailed Heartbeat History Table */}
          {showDetailedHistory && allBeats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <List className="h-4 w-4" aria-hidden="true" />
                  Detailed Heartbeat History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border max-h-96 overflow-x-auto overflow-y-auto" role="region" aria-label="Heartbeat history table" style={{ scrollbarWidth: 'thin' }}>
                  <Table className="min-w-full" role="table" aria-label="Heartbeat history">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] min-w-[100px]" scope="col">Time</TableHead>
                        <TableHead className="w-[90px] min-w-[90px]" scope="col">Status</TableHead>
                        <TableHead className="w-[90px] min-w-[90px]" scope="col">Response</TableHead>
                        <TableHead className="w-[80px] min-w-[80px]" scope="col">Duration</TableHead>
                        <TableHead className="w-[120px] min-w-[120px]" scope="col">Message</TableHead>
                        <TableHead className="w-[90px] min-w-[90px]" scope="col">Down Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...allBeats]
                        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                        .map((beat, index) => (
                          <TableRow key={beat.id} role="row" aria-rowindex={index + 2}>
                            <TableCell className="font-mono text-xs whitespace-nowrap" role="gridcell">
                              <time dateTime={new Date(beat.time).toISOString()}>
                                {format(new Date(beat.time), "HH:mm:ss")}
                              </time>
                            </TableCell>
                            <TableCell className="whitespace-nowrap" role="gridcell">
                              <UptimeStatusBadge status={beat.status} />
                            </TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap" role="gridcell" aria-label={`Response time ${beat.ping > 0 ? beat.ping : 'N/A'} milliseconds`}>
                              {beat.ping > 0 ? `${beat.ping}ms` : "N/A"}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap" role="gridcell">
                              {beat.duration > 0 ? `${beat.duration}s` : "-"}
                            </TableCell>
                            <TableCell className="text-xs max-w-[120px] truncate" role="gridcell" title={beat.msg || undefined}>
                              {beat.msg || (
                                <span className="text-muted-foreground italic">No message</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap" role="gridcell">
                              {beat.down_count > 0 ? (
                                <Badge variant="destructive" className="text-xs" aria-label={`${beat.down_count} consecutive down events`}>
                                  {beat.down_count}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground" aria-hidden="true">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 max-h-96 overflow-y-auto" role="list" aria-label="Heartbeat history list">
                  {[...allBeats]
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((beat) => (
                      <div
                        key={beat.id}
                        className="border rounded-lg p-3 space-y-2"
                        role="listitem"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <time
                              dateTime={new Date(beat.time).toISOString()}
                              className="font-mono text-sm font-medium"
                            >
                              {format(new Date(beat.time), "HH:mm:ss")}
                            </time>
                            <UptimeStatusBadge status={beat.status} />
                          </div>
                          {beat.important && (
                            <Badge variant="outline" className="text-xs">
                              Important
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Response:</span>{" "}
                            <span className="font-medium font-mono" aria-label={`${beat.ping > 0 ? beat.ping : 'N/A'} milliseconds`}>
                              {beat.ping > 0 ? `${beat.ping}ms` : "N/A"}
                            </span>
                          </div>
                          {beat.duration > 0 && (
                            <div>
                              <span className="text-muted-foreground">Duration:</span>{" "}
                              <span className="font-medium">{beat.duration}s</span>
                            </div>
                          )}
                          {beat.down_count > 0 && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Down Count:</span>{" "}
                              <Badge variant="destructive" className="text-xs" aria-label={`${beat.down_count} consecutive down events`}>
                                {beat.down_count}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {beat.msg && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Message: </span>
                            <span>{beat.msg}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                <div className="mt-2 text-xs text-muted-foreground" role="status" aria-live="polite">
                  Showing {allBeats.length} heartbeat{allBeats.length !== 1 ? "s" : ""} from the last hour.
                  {allBeats.filter((b) => b.important).length > 0 && (
                    <span className="ml-2">
                      {allBeats.filter((b) => b.important).length} important event
                      {allBeats.filter((b) => b.important).length !== 1 ? "s" : ""}.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Heartbeat Details */}
          {(latestHeartbeat || monitor.heartbeat) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Latest Heartbeat
                  {latestHeartbeat && (
                    <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                      Real-time
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UptimeStatusBadge status={((latestHeartbeat || monitor.heartbeat)?.status as 0 | 1 | 2) || 0} />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(
                        latestHeartbeatTime || monitor.heartbeat?.time
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {(latestHeartbeat?.ping || monitor.heartbeat?.duration) && (
                      <div>
                        <span className="text-muted-foreground">Response:</span>{" "}
                        <span className="font-medium">
                          {formatResponseTime(
                            latestHeartbeat?.ping || monitor.heartbeat?.duration
                          )}
                        </span>
                      </div>
                    )}
                    {monitor.heartbeat?.duration && latestHeartbeat?.ping && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        <span className="font-medium">
                          {formatResponseTime(monitor.heartbeat.duration)}
                        </span>
                      </div>
                    )}
                    {(!latestHeartbeatTime && monitor.lastCheckTime) && (
                      <div>
                        <span className="text-muted-foreground">Last Check:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(monitor.lastCheckTime), "HH:mm:ss")}
                        </span>
                      </div>
                    )}
                  </div>
                  {(latestHeartbeat?.msg || monitor.heartbeat?.msg) && (
                    <div className="text-sm pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Message: </span>
                      {(latestHeartbeat || monitor.heartbeat)?.msg}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

