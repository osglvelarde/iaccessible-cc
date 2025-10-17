'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/cc/AuthProvider';
import { Monitor, MonitorListResponse } from '@/lib/types/monitoring';
import MonitorForm from '@/components/cc/MonitorForm';
import MonitorTable from '@/components/cc/MonitorTable';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';

export default function UptimeMonitoringPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check permissions
  const canAccess = hasPermission('uptimeMonitoring');
  const canCreate = hasPermission('uptimeMonitoring', 'create_monitors');
  const canDelete = hasPermission('uptimeMonitoring', 'delete_monitors');

  const fetchMonitors = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/monitors');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch monitors');
      }

      const data: MonitorListResponse = await response.json();
      setMonitors(data.monitors);
    } catch (err) {
      console.error('Error fetching monitors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load monitors';
      
      // Check if it's a Kuma connection error
      if (errorMessage.includes('Cannot connect to Uptime Kuma') || 
          errorMessage.includes('Authentication failed') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Connection refused')) {
        setError('Uptime Kuma setup required. Please: 1) Start Uptime Kuma with: docker-compose up -d, 2) Create an account at http://localhost:3001, 3) Update .env.local with correct credentials');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMonitorCreated = useCallback(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const handleMonitorDeleted = useCallback(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchMonitors();
  }, [fetchMonitors]);

  // Load monitors on mount
  useEffect(() => {
    if (canAccess) {
      fetchMonitors();
    }
  }, [canAccess, fetchMonitors]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !canAccess) return;

    const interval = setInterval(() => {
      fetchMonitors();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, canAccess, fetchMonitors]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access uptime monitoring. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uptime Monitoring</h1>
          <p className="text-muted-foreground">
            Track uptime and latency of your websites and services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Notice */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Uptime Kuma Integration:</strong> Real-time monitoring via Socket.io connection.
          <br />
          <strong>Setup:</strong> 1) Start Uptime Kuma with <code>docker-compose up -d</code>, 2) Create account at{' '}
          <Link href="http://localhost:3001" target="_blank" className="underline">
            http://localhost:3001
          </Link>, 3) Update <code>.env.local</code> with your credentials.
        </AlertDescription>
      </Alert>

      {/* Monitor Form */}
      {canCreate && (
        <MonitorForm onMonitorCreated={handleMonitorCreated} />
      )}

      {/* Monitor Table */}
      <MonitorTable
        monitors={monitors}
        onRefresh={handleRefresh}
        onMonitorDeleted={handleMonitorDeleted}
        isLoading={isLoading}
      />

      {/* Empty State */}
      {!isLoading && monitors.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No monitors configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canCreate 
              ? 'Get started by creating your first monitor above.'
              : 'Contact your administrator to create monitors.'
            }
          </p>
        </div>
      )}

      {/* Stats Summary */}
      {monitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold">{monitors.length}</div>
            <div className="text-sm text-muted-foreground">Total Monitors</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {monitors.filter(m => m.status === 'up').length}
            </div>
            <div className="text-sm text-muted-foreground">Online</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {monitors.filter(m => m.status === 'down').length}
            </div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </div>
        </div>
      )}
    </div>
  );
}
