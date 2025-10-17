'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, ExternalLink, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Monitor, MonitorStatus } from '@/lib/types/monitoring';

interface MonitorTableProps {
  monitors: Monitor[];
  onRefresh: () => void;
  onMonitorDeleted: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<MonitorStatus, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  bgColor: string; 
  text: string;
}> = {
  up: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    text: 'Up'
  },
  down: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    text: 'Down'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    text: 'Pending'
  },
  maintenance: {
    icon: Wrench,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    text: 'Maintenance'
  }
};

export default function MonitorTable({ monitors, onRefresh, onMonitorDeleted, isLoading = false }: MonitorTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (monitorId: number) => {
    setDeletingId(monitorId);
    try {
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete monitor');
      }

      onMonitorDeleted();
    } catch (error) {
      console.error('Error deleting monitor:', error);
      // You might want to show a toast notification here
    } finally {
      setDeletingId(null);
    }
  };

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (responseTime: number): string => {
    if (responseTime < 1000) {
      return `${responseTime.toFixed(0)}ms`;
    }
    return `${(responseTime / 1000).toFixed(2)}s`;
  };

  const formatLastCheck = (lastCheck: string): string => {
    const date = new Date(lastCheck);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: MonitorStatus) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={`${config.bgColor} ${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  if (monitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No monitors</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new monitor above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monitors ({monitors.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Avg Response</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor) => (
                <TableRow key={monitor.id}>
                  <TableCell className="font-medium">{monitor.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {monitor.url}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(monitor.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(monitor.status)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatUptime(monitor.uptime)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatResponseTime(monitor.avgResponseTime)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatLastCheck(monitor.lastCheck)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === monitor.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Monitor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{monitor.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(monitor.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
