"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Play, Clock } from "lucide-react";
import { pushRecent } from "@/lib/recent-modules";
import { cn } from "@/lib/utils";

interface ScanStatus {
  running: number;
  scheduled: number;
  completed?: number;
  failed?: number;
}

interface ScanMonitorCardProps {
  title: string;
  desc: string;
  href: string;
  status?: ScanStatus;
}

// Mock data - in a real app this would come from an API
const mockStatus: ScanStatus = {
  running: 3,
  scheduled: 2,
  completed: 15,
  failed: 1
};

export default function ScanMonitorCard({ 
  title, 
  desc, 
  href, 
  status = mockStatus 
}: ScanMonitorCardProps) {
  const open = () => { 
    pushRecent(title, href); 
    window.open(href,"_blank","noopener,noreferrer"); 
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card role="group" className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex-1 flex flex-col gap-3 p-6">
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <CardTitle className="tracking-tight text-lg leading-tight">{title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </CardDescription>
              </div>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {status.running > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="default" 
                        className={cn(
                          "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-help",
                          "dark:bg-blue-500 dark:hover:bg-blue-600 dark:border-blue-500"
                        )}
                      >
                        <Play className="h-3 w-3" aria-hidden="true" />
                        Running {status.running}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                      <p>{status.running} scans currently in progress</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {status.scheduled > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200 cursor-help",
                          "dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800"
                        )}
                      >
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Scheduled {status.scheduled}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                      <p>{status.scheduled} scans waiting to be executed</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {status.failed && status.failed > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 dark:bg-red-500 dark:hover:bg-red-600 cursor-help"
                      >
                        Failed {status.failed}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                      <p>{status.failed} scans failed and need attention</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <Button onClick={open} aria-label={`${title} — opens in a new tab`} className="w-full">
                Open <ExternalLink className="ms-2 h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p className="font-medium">{title}</p>
        <p className="text-xs opacity-90 mt-1">Monitor scan progress and view detailed status</p>
        {(status.running > 0 || status.scheduled > 0) && (
          <p className="text-xs opacity-90 mt-1">
            {status.running > 0 && `${status.running} running`}
            {status.running > 0 && status.scheduled > 0 && " • "}
            {status.scheduled > 0 && `${status.scheduled} scheduled`}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
