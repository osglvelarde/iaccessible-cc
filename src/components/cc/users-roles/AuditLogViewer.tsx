"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  User,
  Shield,
  Building2,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react';
import { AuditLogEntry, AuditLogResponse } from '@/lib/types/users-roles';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogViewerProps {
  organizationId: string;
  canViewAuditLogs: boolean;
}

export default function AuditLogViewer({ 
  organizationId, 
  canViewAuditLogs 
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    resourceType: 'all',
    action: 'all',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  });

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        organizationId,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      });

      if (filters.resourceType !== 'all') {
        queryParams.append('resourceType', filters.resourceType);
      }
      if (filters.action !== 'all') {
        queryParams.append('action', filters.action);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/users-roles/audit-logs?${queryParams}`);
      if (response.ok) {
        const data: AuditLogResponse = await response.json();
        setLogs(data.entries);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages
        }));
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, filters, pagination.page, pagination.pageSize]);

  // Load audit logs
  useEffect(() => {
    if (canViewAuditLogs) {
      loadAuditLogs();
    }
  }, [organizationId, canViewAuditLogs, filters, pagination.page, pagination.pageSize, loadAuditLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('deleted')) return 'destructive';
    if (action.includes('permission')) return 'outline';
    return 'secondary';
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'user': return <User className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      case 'organization': return <Building2 className="h-4 w-4" />;
      case 'operating_unit': return <Settings className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const exportAuditLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        organizationId,
        pageSize: '1000' // Export more data
      });

      if (filters.resourceType !== 'all') {
        queryParams.append('resourceType', filters.resourceType);
      }
      if (filters.action !== 'all') {
        queryParams.append('action', filters.action);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/users-roles/audit-logs?${queryParams}`);
      if (response.ok) {
        const data: AuditLogResponse = await response.json();
        
        // Convert to CSV
        const csvContent = [
          'Timestamp,Action,Resource Type,Resource ID,Actor Email,IP Address,Changes',
          ...data.entries.map(log => [
            log.timestamp,
            log.action,
            log.resourceType,
            log.resourceId,
            log.actorEmail,
            log.ipAddress || '',
            log.changes ? JSON.stringify(log.changes) : ''
          ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  if (!canViewAuditLogs) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
              You don&apos;t have permission to view audit logs
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.resourceType} onValueChange={(value) => handleFilterChange('resourceType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="group">Groups</SelectItem>
                <SelectItem value="organization">Organizations</SelectItem>
                <SelectItem value="operating_unit">Operating Units</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="permission">Permission Changes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {logs.length} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadAuditLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportAuditLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resourceType)}
                        <span className="text-sm capitalize">{log.resourceType.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.resourceId.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.actorEmail}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {log.ipAddress || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <p className="text-muted-foreground">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Action:</span>
                  <p className="text-muted-foreground">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="font-medium">Resource Type:</span>
                  <p className="text-muted-foreground">{selectedLog.resourceType}</p>
                </div>
                <div>
                  <span className="font-medium">Resource ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{selectedLog.resourceId}</p>
                </div>
                <div>
                  <span className="font-medium">Actor:</span>
                  <p className="text-muted-foreground">{selectedLog.actorEmail}</p>
                </div>
                <div>
                  <span className="font-medium">IP Address:</span>
                  <p className="text-muted-foreground">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.changes && (
                <div>
                  <span className="font-medium">Changes:</span>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
