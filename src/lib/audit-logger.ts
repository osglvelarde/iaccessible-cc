import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogEntry, AuditLogResponse } from './types/users-roles';

const DATA_DIR = path.join(process.cwd(), 'users-roles-data');
const AUDIT_DIR = path.join(DATA_DIR, 'audit-logs');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(AUDIT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Audit logger class
export class AuditLogger {
  private static instance: AuditLogger;
  private logBuffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 30000);
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit entry
   */
  async log(
    action: string,
    resourceType: 'user' | 'group' | 'operating_unit' | 'organization',
    resourceId: string,
    organizationId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: uuidv4(),
      action,
      resourceType,
      resourceId,
      organizationId,
      actorId,
      actorEmail,
      changes,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent
    };

    // Add to buffer
    this.logBuffer.push(entry);

    // Flush immediately for critical actions
    if (this.isCriticalAction(action)) {
      await this.flushLogs();
    }
  }

  /**
   * Log user-related actions
   */
  async logUserAction(
    action: string,
    userId: string,
    organizationId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log(action, 'user', userId, organizationId, actorId, actorEmail, changes, ipAddress, userAgent);
  }

  /**
   * Log group-related actions
   */
  async logGroupAction(
    action: string,
    groupId: string,
    organizationId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log(action, 'group', groupId, organizationId, actorId, actorEmail, changes, ipAddress, userAgent);
  }

  /**
   * Log operating unit-related actions
   */
  async logOperatingUnitAction(
    action: string,
    operatingUnitId: string,
    organizationId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log(action, 'operating_unit', operatingUnitId, organizationId, actorId, actorEmail, changes, ipAddress, userAgent);
  }

  /**
   * Log organization-related actions
   */
  async logOrganizationAction(
    action: string,
    organizationId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log(action, 'organization', organizationId, organizationId, actorId, actorEmail, changes, ipAddress, userAgent);
  }

  /**
   * Log permission inheritance actions
   */
  async logPermissionInheritanceAction(
    action: string,
    organizationId: string,
    ruleId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log(action, 'organization', ruleId, organizationId, actorId, actorEmail, changes, ipAddress, userAgent);
  }

  /**
   * Log data access actions
   */
  async logDataAccessAction(
    action: string,
    resourceType: 'scan' | 'dashboard' | 'report',
    resourceId: string,
    organizationId: string,
    operatingUnitId: string,
    actorId: string,
    actorEmail: string,
    changes?: Record<string, { from: unknown; to: unknown }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Map resource types to audit log resource types
    const auditResourceType = resourceType === 'scan' ? 'operating_unit' : 'organization';
    await this.log(action, auditResourceType, resourceId, organizationId, actorId, actorEmail, changes, ipAddress, userAgent);
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    filters: {
      organizationId?: string;
      resourceType?: string;
      action?: string;
      actorId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<AuditLogResponse> {
    await ensureDirectories();

    // Load all audit log files
    const allLogs = await this.loadAllAuditLogs();

    // Apply filters
    let filteredLogs = allLogs;

    if (filters.organizationId) {
      filteredLogs = filteredLogs.filter(log => log.organizationId === filters.organizationId);
    }

    if (filters.resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === filters.resourceType);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.actorId) {
      filteredLogs = filteredLogs.filter(log => log.actorId === filters.actorId);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return {
      entries: paginatedLogs,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Get audit logs for a specific organization
   */
  async getOrganizationAuditLogs(
    organizationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditLogResponse> {
    return this.getAuditLogs({
      organizationId,
      page,
      pageSize
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    organizationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditLogResponse> {
    return this.getAuditLogs({
      organizationId,
      resourceType: 'user',
      page,
      pageSize
    });
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resourceType: 'user' | 'group' | 'operating_unit' | 'organization',
    resourceId: string,
    organizationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditLogResponse> {
    return this.getAuditLogs({
      organizationId,
      resourceType,
      page,
      pageSize
    });
  }

  /**
   * Get audit statistics for an organization
   */
  async getAuditStatistics(organizationId: string): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByResource: Record<string, number>;
    recentActivity: number;
    topActors: Array<{ actorId: string; actorEmail: string; count: number }>;
  }> {
    const logs = await this.getAuditLogs({ organizationId, pageSize: 1000 });
    const entries = logs.entries;

    const totalActions = entries.length;

    // Actions by type
    const actionsByType: Record<string, number> = {};
    entries.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    });

    // Actions by resource
    const actionsByResource: Record<string, number> = {};
    entries.forEach(log => {
      actionsByResource[log.resourceType] = (actionsByResource[log.resourceType] || 0) + 1;
    });

    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentActivity = entries.filter(log => log.timestamp >= oneDayAgo).length;

    // Top actors
    const actorCounts: Record<string, { actorId: string; actorEmail: string; count: number }> = {};
    entries.forEach(log => {
      const key = log.actorId;
      if (!actorCounts[key]) {
        actorCounts[key] = {
          actorId: log.actorId,
          actorEmail: log.actorEmail,
          count: 0
        };
      }
      actorCounts[key].count++;
    });

    const topActors = Object.values(actorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActions,
      actionsByType,
      actionsByResource,
      recentActivity,
      topActors
    };
  }

  /**
   * Flush logs to disk
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    await ensureDirectories();

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Group logs by date for better organization
    const logsByDate = logsToFlush.reduce((acc, log) => {
      const date = log.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {} as Record<string, AuditLogEntry[]>);

    // Write logs for each date
    for (const [date, logs] of Object.entries(logsByDate)) {
      const filePath = path.join(AUDIT_DIR, `audit-${date}.json`);
      
      try {
        // Load existing logs for this date
        let existingLogs: AuditLogEntry[] = [];
        try {
          const existingContent = await fs.readFile(filePath, 'utf-8');
          existingLogs = JSON.parse(existingContent);
        } catch (error) {
          // File doesn't exist yet, start with empty array
        }

        // Append new logs
        const allLogs = [...existingLogs, ...logs];
        
        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(allLogs, null, 2));
      } catch (error) {
        console.error(`Error writing audit logs for ${date}:`, error);
        // Put logs back in buffer for retry
        this.logBuffer.unshift(...logs);
      }
    }
  }

  /**
   * Load all audit logs from disk
   */
  private async loadAllAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const files = await fs.readdir(AUDIT_DIR);
      const logFiles = files.filter(file => file.startsWith('audit-') && file.endsWith('.json'));
      
      const allLogs: AuditLogEntry[] = [];
      for (const file of logFiles) {
        try {
          const filePath = path.join(AUDIT_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const logs: AuditLogEntry[] = JSON.parse(fileContent);
          allLogs.push(...logs);
        } catch (error) {
          console.error(`Error reading audit log file ${file}:`, error);
        }
      }
      
      return allLogs;
    } catch (error) {
      console.error('Error loading audit logs:', error);
      return [];
    }
  }

  /**
   * Check if an action is critical and should be flushed immediately
   */
  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'user_deleted',
      'group_deleted',
      'organization_deleted',
      'operating_unit_deleted',
      'permission_changed',
      'role_changed',
      'access_revoked'
    ];
    
    return criticalActions.includes(action);
  }

  /**
   * Cleanup old audit logs (older than specified days)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    try {
      const files = await fs.readdir(AUDIT_DIR);
      const logFiles = files.filter(file => file.startsWith('audit-') && file.endsWith('.json'));
      
      for (const file of logFiles) {
        const dateMatch = file.match(/audit-(\d{4}-\d{2}-\d{2})\.json/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate < cutoffDate) {
            const filePath = path.join(AUDIT_DIR, file);
            await fs.unlink(filePath);
            console.log(`Deleted old audit log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
    }
  }

  /**
   * Destroy the audit logger instance
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    // Flush any remaining logs
    this.flushLogs();
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Utility functions for common audit logging scenarios
export async function logUserCreation(
  userId: string,
  organizationId: string,
  actorId: string,
  actorEmail: string,
  userData: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLogger.logUserAction(
    'user_created',
    userId,
    organizationId,
    actorId,
    actorEmail,
    { userData: { from: null, to: userData } },
    ipAddress,
    userAgent
  );
}

export async function logUserUpdate(
  userId: string,
  organizationId: string,
  actorId: string,
  actorEmail: string,
  changes: Record<string, { from: unknown; to: unknown }>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLogger.logUserAction(
    'user_updated',
    userId,
    organizationId,
    actorId,
    actorEmail,
    changes,
    ipAddress,
    userAgent
  );
}

export async function logUserDeletion(
  userId: string,
  organizationId: string,
  actorId: string,
  actorEmail: string,
  userData: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLogger.logUserAction(
    'user_deleted',
    userId,
    organizationId,
    actorId,
    actorEmail,
    { userData: { from: userData, to: null } },
    ipAddress,
    userAgent
  );
}

export async function logOrganizationCreation(
  organizationId: string,
  actorId: string,
  actorEmail: string,
  organizationData: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLogger.logOrganizationAction(
    'organization_created',
    organizationId,
    actorId,
    actorEmail,
    { organizationData: { from: null, to: organizationData } },
    ipAddress,
    userAgent
  );
}

export async function logPermissionChange(
  resourceType: 'user' | 'group',
  resourceId: string,
  organizationId: string,
  actorId: string,
  actorEmail: string,
  changes: Record<string, { from: unknown; to: unknown }>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await auditLogger.log(
    'permission_changed',
    resourceType,
    resourceId,
    organizationId,
    actorId,
    actorEmail,
    changes,
    ipAddress,
    userAgent
  );
}
