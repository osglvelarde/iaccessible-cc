"use client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanStatusProps {
  isScanning: boolean;
  progress?: number;
  status?: string;
  onCancel?: () => void;
  className?: string;
}

export default function ScanStatus({ 
  isScanning, 
  progress = 0, 
  status = "Analyzing webpage...", 
  onCancel,
  className 
}: ScanStatusProps) {
  if (!isScanning) return null;

  return (
    <Card className={cn("shadow-sm animate-in fade-in-0 slide-in-from-top-2", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Scan is running, please wait...</p>
            </TooltipContent>
          </Tooltip>
          <span>Scan in Progress</span>
        </CardTitle>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="relative bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Scan progress: ${Math.round(progress)}%`}
              />
            </div>
          </div>

          {/* Status Message */}
          <div 
            className="text-sm text-muted-foreground" 
            role="status" 
            aria-live="polite"
            aria-atomic="true"
          >
            {status}
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <div className="pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onCancel}
                    className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Scan
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop the current scan</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
