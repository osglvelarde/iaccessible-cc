"use client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfScanStatusProps {
  isScanning: boolean;
  progress?: number;
  status?: string;
  onCancel?: () => void;
  className?: string;
}

export default function PdfScanStatus({ 
  isScanning, 
  progress = 0, 
  status = "Analyzing PDF document...", 
  onCancel,
  className 
}: PdfScanStatusProps) {
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
              <p>PDF scan is running, please wait...</p>
            </TooltipContent>
          </Tooltip>
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>PDF Scan in Progress</span>
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
                aria-label={`PDF scan progress: ${Math.round(progress)}%`}
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

          {/* Scan Steps */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Scan Steps:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className={cn(
                "flex items-center gap-2 p-2 rounded",
                progress > 20 ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300" : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  progress > 20 ? "bg-green-500" : "bg-muted-foreground"
                )} />
                Document Analysis
              </div>
              <div className={cn(
                "flex items-center gap-2 p-2 rounded",
                progress > 50 ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300" : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  progress > 50 ? "bg-green-500" : "bg-muted-foreground"
                )} />
                Accessibility Check
              </div>
              <div className={cn(
                "flex items-center gap-2 p-2 rounded",
                progress > 80 ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300" : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  progress > 80 ? "bg-green-500" : "bg-muted-foreground"
                )} />
                Report Generation
              </div>
            </div>
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
                  <p>Stop the current PDF scan</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
