"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  ExternalLink,
  Eye,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "scan_completed" | "scan_failed" | "alert" | "notification" | "scheduled";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "error" | "info";
  actionUrl?: string;
  actionLabel?: string;
}

interface ScanHistoryItem {
  id: string | number;
  url: string;
  date: string;
  status: "completed" | "failed" | "running";
  accessibilityScore?: number | null;
  seoScore?: number | null;
  readabilityScore?: number | null;
  totalIssues?: number;
}

// Mock data for demonstration
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "scan_completed",
    title: "Webpage Scan Completed",
    description: "Accessibility scan for example.gov finished successfully",
    timestamp: "2024-01-15T14:30:00Z",
    status: "success",
    actionUrl: "/scan/ad-hoc",
    actionLabel: "View Results"
  },
  {
    id: "2",
    type: "scan_failed",
    title: "PDF Scan Failed",
    description: "PDF accessibility scan for report.pdf encountered an error",
    timestamp: "2024-01-15T13:45:00Z",
    status: "error",
    actionUrl: "/scan/pdf",
    actionLabel: "Retry Scan"
  },
  {
    id: "3",
    type: "alert",
    title: "High Error Rate Detected",
    description: "Accessibility compliance score dropped below 70% threshold",
    timestamp: "2024-01-15T12:20:00Z",
    status: "warning",
    actionUrl: "/dashboard",
    actionLabel: "View Dashboard"
  },
  {
    id: "4",
    type: "notification",
    title: "Scheduled Scan Ready",
    description: "Weekly accessibility scan for demo.gov is ready to run",
    timestamp: "2024-01-15T10:00:00Z",
    status: "info",
    actionUrl: "/scans/scheduler",
    actionLabel: "Review Schedule"
  },
  {
    id: "5",
    type: "scan_completed",
    title: "Sitemap Analysis Complete",
    description: "Site structure analysis for example.gov completed",
    timestamp: "2024-01-15T09:15:00Z",
    status: "success",
    actionUrl: "/sitemap",
    actionLabel: "View Sitemap"
  }
];

// Transform scan history into activity items
const transformScanHistoryToActivities = (scanHistory: ScanHistoryItem[]): ActivityItem[] => {
  return scanHistory
    .filter(scan => scan && scan.url && scan.date) // Filter out invalid entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
    .map(scan => {
      const isCompleted = scan.status === "completed";
      const isFailed = scan.status === "failed";
      const isRunning = scan.status === "running";
      
      let title = "";
      let description = "";
      let type: ActivityItem["type"] = "scan_completed";
      let status: ActivityItem["status"] = "success";
      
      if (isRunning) {
        title = "Automated Scan in Progress";
        description = `Scanning ${scan.url}`;
        type = "notification";
        status = "info";
      } else if (isFailed) {
        title = "Automated Scan Failed";
        description = `Scan failed for ${scan.url}`;
        type = "scan_failed";
        status = "error";
      } else if (isCompleted) {
        const accessibilityScore = scan.accessibilityScore || 0;
        const seoScore = scan.seoScore || 0;
        const readabilityScore = scan.readabilityScore || 0;
        const totalIssues = scan.totalIssues || 0;
        
        title = "Automated Scan Completed";
        description = `${scan.url} - Accessibility: ${accessibilityScore}%, SEO: ${seoScore}%, Readability: ${readabilityScore}% (${totalIssues} issues)`;
        type = "scan_completed";
        
        // Determine status based on scores
        if (accessibilityScore >= 80) {
          status = "success";
        } else if (accessibilityScore >= 60) {
          status = "warning";
        } else {
          status = "error";
        }
      }
      
      return {
        id: `scan-${scan.id}`,
        type,
        title,
        description,
        timestamp: scan.date,
        status,
        actionUrl: "/scan/ad-hoc",
        actionLabel: isRunning ? "View Progress" : "View Results"
      };
    });
};

interface ActivityDropdownProps {
  scanHistory?: ScanHistoryItem[];
}

export default function ActivityDropdown({ scanHistory = [] }: ActivityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const unreadCount = activities.filter(a => a.status === "error" || a.status === "warning").length;

  // Load activities on client side to prevent hydration mismatch
  useEffect(() => {
    // Use real scan history if available, otherwise fall back to mock data
    const realActivities = scanHistory.length > 0 ? transformScanHistoryToActivities(scanHistory) : mockActivities;
    setActivities(realActivities.slice(0, 5));
  }, [scanHistory]);

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case "scan_completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scan_failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "notification":
        return <Info className="h-4 w-4 text-blue-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "warning": return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700";
      case "error": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
      case "info": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Activity className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Recent Activity ({activities.length})</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="font-semibold">Recent Activity</span>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {activities.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="p-2">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group",
                  "animate-in fade-in-0 slide-in-from-right-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  if (activity.actionUrl) {
                    if (activity.actionUrl.startsWith('/')) {
                      window.location.href = activity.actionUrl;
                    } else {
                      window.open(activity.actionUrl, '_blank', 'noopener,noreferrer');
                    }
                  }
                  setIsOpen(false);
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs px-1.5 py-0.5", getStatusColor(activity.status))}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    {activity.actionUrl && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View All Activity
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
