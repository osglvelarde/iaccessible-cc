"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { UptimeStatus } from "@/lib/uptime-kuma-api";
import { cn } from "@/lib/utils";

interface UptimeStatusBadgeProps {
  status: UptimeStatus;
  className?: string;
  showIcon?: boolean;
}

export function UptimeStatusBadge({ 
  status, 
  className,
  showIcon = true 
}: UptimeStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 0: // Down
        return {
          label: "Down",
          icon: XCircle,
          variant: "destructive" as const,
          className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
        };
      case 1: // Up
        return {
          label: "Up",
          icon: CheckCircle2,
          variant: "default" as const,
          className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        };
      case 2: // Pending
      default:
        return {
          label: "Pending",
          icon: AlertCircle,
          variant: "outline" as const,
          className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.label}</span>
    </Badge>
  );
}




