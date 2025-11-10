"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { MonitorCard, SyncDialog, MonitorFormDialog, MonitorDetailsDialog } from "@/components/cc/uptime-monitoring";
import { MonitorFormData } from "@/components/cc/uptime-monitoring/MonitorFormDialog";
import { getMonitors, UptimeKumaMonitor, UptimeStatus, createMonitor, updateMonitor } from "@/lib/uptime-kuma-api";
import { SyncResult } from "@/lib/uptime-sync-service";

export default function UptimeMonitoringPage() {
  const [monitors, setMonitors] = useState<UptimeKumaMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UptimeStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<UptimeKumaMonitor | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<UptimeKumaMonitor | null>(null);

  // Load monitors
  const loadMonitors = useCallback(async (preserveData = false) => {
    try {
      setError(null);
      // Don't set loading to true if we're preserving data (e.g., after adding a monitor)
      if (!preserveData) {
        setLoading(true);
      }
      const data = await getMonitors();
      setMonitors(data);
    } catch (err) {
      console.error("Failed to load monitors:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load monitors. Please check if Uptime Kuma is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMonitors();
  }, [loadMonitors]);

  // Auto-refresh monitors every 30 seconds to keep data fresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadMonitors(true); // Preserve data during auto-refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadMonitors]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMonitors();
  };

  // Handle sync
  const handleSync = async (): Promise<SyncResult> => {
    try {
      const response = await fetch("/api/uptime-kuma/sync", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const result: SyncResult = await response.json();
      
      // Refresh monitors after sync
      if (result.success) {
        setTimeout(() => {
          loadMonitors();
        }, 1000);
      }
      
      return result;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to sync domains"
      );
    }
  };

  // Filter monitors
  const filteredMonitors = monitors.filter((monitor) => {
    // Search filter
    const matchesSearch =
      monitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitor.url.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || monitor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  // Status mapping: 0 = down, 1 = up, 2 = pending
  const stats = {
    total: monitors.length,
    up: monitors.filter((m) => m.status === 1).length,
    down: monitors.filter((m) => m.status === 0).length,
    pending: monitors.filter((m) => m.status === 2).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Uptime Monitoring Tool</h1>
            <Badge variant="outline" className="text-sm">
              <Activity className="h-3 w-3 mr-1" />
              Monitor Status
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Command Center
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Monitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.up}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Down
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.down}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monitors</CardTitle>
              <div className="flex gap-2">
                <SyncDialog onSync={handleSync} />
                <MonitorFormDialog
                  monitor={editingMonitor || undefined}
                  onSave={async (data: MonitorFormData) => {
                    try {
                      if (editingMonitor) {
                        await updateMonitor(editingMonitor.id, data as any);
                      } else {
                        await createMonitor(data);
                      }
                      setEditingMonitor(null);
                      
                      // Refresh monitors with retries to ensure new monitor appears
                      // Uptime Kuma may need a moment to process and include in metrics
                      const maxRetries = 3;
                      let retryCount = 0;
                      let success = false;
                      
                      while (retryCount < maxRetries && !success) {
                        await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)));
                        try {
                          await loadMonitors(true); // Preserve existing data during refresh
                          // Check if we got more monitors (for new monitor) or if update succeeded
                          success = true;
                        } catch (err) {
                          retryCount++;
                          if (retryCount >= maxRetries) {
                            console.error("Failed to refresh monitors after retries:", err);
                            // Still show success message even if refresh failed
                            // The next manual refresh or auto-refresh will pick it up
                          }
                        }
                      }
                    } catch (error) {
                      console.error("Failed to save monitor:", error);
                      alert(error instanceof Error ? error.message : "Failed to save monitor");
                      throw error;
                    }
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search monitors by name or URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(1)}
                  className={
                    statusFilter === 1
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Up
                </Button>
                <Button
                  variant={statusFilter === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(0)}
                  className={
                    statusFilter === 0
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  }
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Down
                </Button>
                <Button
                  variant={statusFilter === 2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(2)}
                  className={
                    statusFilter === 2
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                  }
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Pending
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredMonitors.length} of {monitors.length} monitors
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMonitors.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No monitors found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {monitors.length === 0
                  ? "No monitors are configured yet. Sync domains from Operating Units to get started."
                  : "No monitors match your search criteria."}
              </p>
              {monitors.length === 0 && (
                <SyncDialog onSync={handleSync}>
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Domains
                  </Button>
                </SyncDialog>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monitors Grid */}
        {!loading && !error && filteredMonitors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMonitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                onViewDetails={(monitor) => {
                  setSelectedMonitor(monitor);
                  setDetailsOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Monitor Details Dialog */}
        <MonitorDetailsDialog
          monitor={selectedMonitor}
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedMonitor(null);
          }}
          onEdit={(monitor) => {
            setEditingMonitor(monitor);
            setDetailsOpen(false);
          }}
        />

        {/* Monitor Form Dialog - for editing */}
        {editingMonitor && (
          <MonitorFormDialog
            monitor={editingMonitor}
            onSave={async (data: MonitorFormData) => {
              try {
                await updateMonitor(editingMonitor.id, data as any);
                setEditingMonitor(null);
                
                // Refresh monitors after update
                await new Promise(resolve => setTimeout(resolve, 1500));
                await loadMonitors(true); // Preserve existing data during refresh
              } catch (error) {
                console.error("Failed to update monitor:", error);
                alert(error instanceof Error ? error.message : "Failed to update monitor");
                throw error;
              }
            }}
          >
            <div style={{ display: 'none' }} />
          </MonitorFormDialog>
        )}
      </div>
    </div>
  );
}
