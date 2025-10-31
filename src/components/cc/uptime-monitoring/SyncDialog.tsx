"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { SyncResult } from "@/lib/uptime-sync-service";

interface SyncDialogProps {
  onSync?: () => Promise<SyncResult>;
  children?: React.ReactNode;
}

export function SyncDialog({ onSync, children }: SyncDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    if (!onSync) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const syncResult = await onSync();
      setResult(syncResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to sync domains",
        addedMonitors: [],
        skippedMonitors: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after a delay to allow animations
    setTimeout(() => {
      setResult(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Domains
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sync Operating Unit Domains</DialogTitle>
          <DialogDescription>
            Sync domains from Operating Units to Uptime Kuma monitors. This will check all domains
            from your Operating Units and create monitors for any that don&apos;t exist yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result && !loading && (
            <div className="text-sm text-muted-foreground">
              Click &quot;Start Sync&quot; to begin syncing domains from your Operating Units to Uptime Kuma.
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <div className="font-medium">Syncing domains...</div>
                <div className="text-sm text-muted-foreground">
                  This may take a few moments
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Success/Error Status */}
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium ${
                      result.success
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {result.message}
                  </div>
                </div>
              </div>

              {/* Added Monitors */}
              {result.addedMonitors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Added Monitors ({result.addedMonitors.length})</span>
                  </div>
                  <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                    {result.addedMonitors.map((domain, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {domain}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skipped Monitors */}
              {result.skippedMonitors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span>Already Monitored ({result.skippedMonitors.length})</span>
                  </div>
                  <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                    {result.skippedMonitors.map((domain, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                        {domain}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Errors ({result.errors.length})</span>
                  </div>
                  <ul className="space-y-1 ml-6 text-sm text-red-600 dark:text-red-400">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result && !loading && (
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          )}
          {!result && !loading && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSync}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Sync
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
