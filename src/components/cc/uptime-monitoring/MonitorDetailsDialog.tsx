"use client";

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
import { UptimeStatusBadge } from "./UptimeStatusBadge";
import { UptimeKumaMonitor } from "@/lib/uptime-kuma-api";
import {
  ExternalLink,
  Clock,
  Activity,
  Globe,
  TrendingUp,
  Calendar,
  Shield,
  X,
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

  const calculateUptime = () => {
    if (!monitor.uptime) return "N/A";
    return `${monitor.uptime.toFixed(2)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {monitor.name}
                <UptimeStatusBadge status={monitor.status} />
              </DialogTitle>
              <DialogDescription className="mt-2">
                Monitor ID: {monitor.id} • Type: {monitor.type.toUpperCase()}
              </DialogDescription>
            </div>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(monitor)}>
                Edit
              </Button>
            )}
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
                    <UptimeStatusBadge status={monitor.status} className="mt-1" />
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
                  {monitor.avgResponseTime !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Average</div>
                      <div className="text-lg font-semibold">
                        {formatResponseTime(monitor.avgResponseTime)}
                      </div>
                    </div>
                  )}
                  {monitor.maxResponseTime !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Max</div>
                      <div className="text-sm">{formatResponseTime(monitor.maxResponseTime)}</div>
                    </div>
                  )}
                  {monitor.minResponseTime !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">Min</div>
                      <div className="text-sm">{formatResponseTime(monitor.minResponseTime)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitor.lastCheckTime && (
                  <div>
                    <div className="text-xs text-muted-foreground">Last Check</div>
                    <div className="text-sm">{formatTimestamp(monitor.lastCheckTime)}</div>
                  </div>
                )}
                {monitor.heartbeat && (
                  <div>
                    <div className="text-xs text-muted-foreground">Last Heartbeat</div>
                    <div className="text-sm">{formatTimestamp(monitor.heartbeat.time)}</div>
                    {monitor.heartbeat.duration && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Duration: {formatResponseTime(monitor.heartbeat.duration)}
                      </div>
                    )}
                    {monitor.heartbeat.msg && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Message: {monitor.heartbeat.msg}
                      </div>
                    )}
                  </div>
                )}
                {monitor.statusMessage && (
                  <div>
                    <div className="text-xs text-muted-foreground">Status Message</div>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {monitor.statusMessage}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Heartbeat Details */}
          {monitor.heartbeat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Latest Heartbeat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UptimeStatusBadge status={monitor.heartbeat.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(monitor.heartbeat.time)}
                    </span>
                  </div>
                  {monitor.heartbeat.msg && (
                    <div className="text-sm">{monitor.heartbeat.msg}</div>
                  )}
                  {monitor.heartbeat.duration && (
                    <div className="text-xs text-muted-foreground">
                      Response time: {formatResponseTime(monitor.heartbeat.duration)}
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

