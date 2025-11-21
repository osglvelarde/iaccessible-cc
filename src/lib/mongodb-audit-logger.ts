import { getDatabase } from './mongodb';
import { AuditLogEntry, AuditLogResponse } from './types/users-roles';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'auditLogs';

/**
 * MongoDB-based audit logger
 */
export class MongoDBAuditLogger {
  /**
   * Log an audit entry to MongoDB
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
    try {
      const db = await getDatabase();
      const collection = db.collection<AuditLogEntry>(COLLECTION_NAME);

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

      await collection.insertOne(entry);
    } catch (error) {
      console.error('Error logging audit entry to MongoDB:', error);
      // Don't throw - audit logging failures shouldn't break the main operation
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    filters: {
      organizationId?: string;
      resourceType?: string;
      resourceId?: string;
      action?: string;
      actorId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<AuditLogResponse> {
    try {
      const db = await getDatabase();
      const collection = db.collection<AuditLogEntry>(COLLECTION_NAME);

      // Build query
      const query: any = {};

      if (filters.organizationId) {
        query.organizationId = filters.organizationId;
      }

      if (filters.resourceType) {
        query.resourceType = filters.resourceType;
      }

      if (filters.resourceId) {
        query.resourceId = filters.resourceId;
      }

      if (filters.action) {
        query.action = filters.action;
      }

      if (filters.actorId) {
        query.actorId = filters.actorId;
      }

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      // Get total count
      const total = await collection.countDocuments(query);

      // Pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 50;
      const skip = (page - 1) * pageSize;
      const totalPages = Math.ceil(total / pageSize);

      // Fetch entries
      const entries = await collection
        .find(query)
        .sort({ timestamp: -1 }) // Newest first
        .skip(skip)
        .limit(pageSize)
        .toArray();

      return {
        entries,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching audit logs from MongoDB:', error);
      throw error;
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
}

// Export singleton instance
export const mongoDBAuditLogger = new MongoDBAuditLogger();

// Helper function to get request metadata
export function getRequestMetadata(request: Request): { ipAddress?: string; userAgent?: string } {
  const headers = request.headers;
  return {
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined
  };
}

