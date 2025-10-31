"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { UptimeStatusBadge } from "./UptimeStatusBadge";
import { UptimeKumaMonitor } from "@/lib/uptime-kuma-api";
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

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="truncate">{monitor.name}</span>
              <UptimeStatusBadge status={monitor.status} />
            </CardTitle>
          </div>
          {onViewDetails && (
            <Button
              variant="ghost"
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

          {/* Response Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Response Time</div>
              <div className="text-sm font-medium">
                {formatResponseTime(monitor.avgResponseTime)}
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
        {monitor.lastCheckTime && (
          <div className="text-xs text-muted-foreground">
            Last checked: {formatLastCheck(monitor.lastCheckTime)}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Monitor ID: {monitor.id}</span>
          {monitor.heartbeat && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              Active
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
