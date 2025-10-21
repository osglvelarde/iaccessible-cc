import { 
  User, 
  UserGroup, 
  Organization, 
  OperatingUnit, 
  UserWithDetails,
  CreateUserRequest 
} from './types/users-roles';

// Bulk operations utilities for user management with organization hierarchy
export class BulkOperationsManager {
  /**
   * Parse CSV data for bulk user import
   */
  parseUserImportCSV(csvData: string): {
    users: CreateUserRequest[];
    errors: string[];
  } {
    const lines = csvData.split('\n').filter(line => line.trim());
    const users: CreateUserRequest[] = [];
    const errors: string[] = [];

    // Expected CSV format: email,firstName,lastName,organizationId,operatingUnitId,groupIds
    const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase());
    
    if (!headers || !this.validateCSVHeaders(headers)) {
      errors.push('Invalid CSV format. Expected headers: email,firstName,lastName,organizationId,operatingUnitId,groupIds');
      return { users, errors };
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      const userData = this.mapCSVToUser(values, headers, i + 1);
      
      if (userData.error) {
        errors.push(`Row ${i + 1}: ${userData.error}`);
      } else {
        users.push(userData.user!);
      }
    }

    return { users, errors };
  }

  /**
   * Validate CSV headers
   */
  private validateCSVHeaders(headers: string[]): boolean {
    const requiredHeaders = ['email', 'firstname', 'lastname', 'organizationid', 'operatingunitid'];
    return requiredHeaders.every(header => headers.includes(header));
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Map CSV values to user data
   */
  private mapCSVToUser(
    values: string[], 
    headers: string[], 
    rowNumber: number
  ): { user?: CreateUserRequest; error?: string } {
    const data: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      data[header] = values[index] || '';
    });

    // Validate required fields
    if (!data.email) {
      return { error: 'Email is required' };
    }
    if (!data.firstname) {
      return { error: 'First name is required' };
    }
    if (!data.lastname) {
      return { error: 'Last name is required' };
    }
    if (!data.organizationid) {
      return { error: 'Organization ID is required' };
    }
    if (!data.operatingunitid) {
      return { error: 'Operating Unit ID is required' };
    }

    // Parse group IDs
    const groupIds = data.groupids ? data.groupids.split(';').map(id => id.trim()).filter(id => id) : [];

    return {
      user: {
        email: data.email,
        firstName: data.firstname,
        lastName: data.lastname,
        organizationId: data.organizationid,
        operatingUnitId: data.operatingunitid,
        groupIds,
        sendInvitation: true
      }
    };
  }

  /**
   * Generate CSV template for user import
   */
  generateUserImportTemplate(): string {
    const headers = [
      'email',
      'firstName',
      'lastName',
      'organizationId',
      'operatingUnitId',
      'groupIds'
    ];
    
    const sampleData = [
      'john.doe@example.com',
      'John',
      'Doe',
      'org-1',
      'ou-1',
      'group-1;group-2'
    ];

    return [headers.join(','), sampleData.join(',')].join('\n');
  }

  /**
   * Export users to CSV with organization hierarchy
   */
  exportUsersToCSV(
    users: UserWithDetails[],
    organizations: Organization[],
    operatingUnits: OperatingUnit[],
    groups: UserGroup[]
  ): string {
    const headers = [
      'id',
      'email',
      'firstName',
      'lastName',
      'organizationName',
      'operatingUnitName',
      'groupNames',
      'status',
      'createdAt',
      'lastLogin'
    ];

    const rows = users.map(user => {
      const organization = organizations.find(org => org.id === user.organization?.id);
      const operatingUnit = operatingUnits.find(ou => ou.id === user.operatingUnitId);
      const userGroups = groups.filter(group => user.groupIds.includes(group.id));
      
      return [
        user.id,
        user.email,
        user.firstName,
        user.lastName,
        organization?.name || 'Unknown',
        operatingUnit?.name || 'Unknown',
        userGroups.map(g => g.name).join(';'),
        user.status,
        user.createdAt,
        user.lastLogin || 'Never'
      ].map(field => this.escapeCSVField(field));
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export groups to CSV with organization hierarchy
   */
  exportGroupsToCSV(
    groups: UserGroup[],
    organizations: Organization[],
    operatingUnits: OperatingUnit[]
  ): string {
    const headers = [
      'id',
      'name',
      'type',
      'scope',
      'organizationName',
      'operatingUnitName',
      'permissionCount',
      'isSystemGroup',
      'createdAt',
      'createdBy'
    ];

    const rows = groups.map(group => {
      const organization = organizations.find(org => org.id === group.organizationId);
      const operatingUnit = operatingUnits.find(ou => ou.id === group.operatingUnitId);
      const permissionCount = group.permissions.reduce((count, module) => 
        count + module.features.length, 0
      );
      
      return [
        group.id,
        group.name,
        group.type,
        group.scope,
        organization?.name || 'Unknown',
        operatingUnit?.name || 'N/A',
        permissionCount.toString(),
        group.isSystemGroup.toString(),
        group.createdAt,
        group.createdBy
      ].map(field => this.escapeCSVField(field));
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export operating units to CSV with organization hierarchy
   */
  exportOperatingUnitsToCSV(
    operatingUnits: OperatingUnit[],
    organizations: Organization[]
  ): string {
    const headers = [
      'id',
      'name',
      'organizationName',
      'domains',
      'createdAt',
      'updatedAt'
    ];

    const rows = operatingUnits.map(ou => {
      const organization = organizations.find(org => org.id === ou.organizationId);
      
      return [
        ou.id,
        ou.name,
        organization?.name || 'Unknown',
        ou.domains.join(';'),
        ou.createdAt,
        ou.updatedAt
      ].map(field => this.escapeCSVField(field));
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export organizations to CSV
   */
  exportOrganizationsToCSV(organizations: Organization[]): string {
    const headers = [
      'id',
      'name',
      'slug',
      'domains',
      'status',
      'maxUsers',
      'maxOperatingUnits',
      'features',
      'createdAt',
      'createdBy'
    ];

    const rows = organizations.map(org => [
      org.id,
      org.name,
      org.slug,
      org.domains.join(';'),
      org.status,
      org.settings.maxUsers.toString(),
      org.settings.maxOperatingUnits.toString(),
      org.settings.features.join(';'),
      org.createdAt,
      org.createdBy
    ].map(field => this.escapeCSVField(field)));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Bulk assign users to groups
   */
  async bulkAssignUsersToGroups(
    userIds: string[],
    groupIds: string[],
    organizationId: string,
    actorId: string,
    actorEmail: string
  ): Promise<{
    success: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    const results = {
      success: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    for (const userId of userIds) {
      try {
        // In a real implementation, this would make API calls
        // For now, we'll simulate the operation
        console.log(`Assigning user ${userId} to groups ${groupIds.join(', ')}`);
        results.success++;
      } catch (error) {
        results.errors.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(
    users: CreateUserRequest[],
    actorId: string,
    actorEmail: string
  ): Promise<{
    success: number;
    errors: Array<{ user: CreateUserRequest; error: string }>;
  }> {
    const results = {
      success: 0,
      errors: [] as Array<{ user: CreateUserRequest; error: string }>
    };

    for (const user of users) {
      try {
        // In a real implementation, this would make API calls
        console.log(`Creating user: ${user.email}`);
        results.success++;
      } catch (error) {
        results.errors.push({
          user,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Validate organization hierarchy for bulk operations
   */
  validateOrganizationHierarchy(
    users: CreateUserRequest[],
    organizations: Organization[],
    operatingUnits: OperatingUnit[]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const orgIds = new Set(organizations.map(org => org.id));
    const ouMap = new Map<string, string>(); // ouId -> orgId

    operatingUnits.forEach(ou => {
      ouMap.set(ou.id, ou.organizationId);
    });

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rowNum = i + 2; // +2 because CSV has header row

      // Validate organization exists
      if (user.organizationId && !orgIds.has(user.organizationId)) {
        errors.push(`Row ${rowNum}: Organization ${user.organizationId} does not exist`);
      }

      // Validate operating unit exists and belongs to organization
      if (!ouMap.has(user.operatingUnitId)) {
        errors.push(`Row ${rowNum}: Operating unit ${user.operatingUnitId} does not exist`);
      } else if (ouMap.get(user.operatingUnitId) !== user.organizationId) {
        errors.push(`Row ${rowNum}: Operating unit ${user.operatingUnitId} does not belong to organization ${user.organizationId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   */
  private escapeCSVField(field: string | number | boolean): string {
    const str = String(field);
    
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  /**
   * Generate bulk operations report
   */
  generateBulkOperationsReport(
    operation: string,
    totalItems: number,
    successCount: number,
    errorCount: number,
    errors: Array<{ item: string; error: string }>
  ): string {
    const report = [
      `Bulk ${operation} Report`,
      `Generated: ${new Date().toISOString()}`,
      '',
      `Total Items: ${totalItems}`,
      `Successful: ${successCount}`,
      `Failed: ${errorCount}`,
      `Success Rate: ${((successCount / totalItems) * 100).toFixed(2)}%`,
      ''
    ];

    if (errors.length > 0) {
      report.push('Errors:');
      errors.forEach(({ item, error }) => {
        report.push(`- ${item}: ${error}`);
      });
    }

    return report.join('\n');
  }
}

// Export singleton instance
export const bulkOperationsManager = new BulkOperationsManager();

// Utility functions
export function parseUserImportCSV(csvData: string) {
  return bulkOperationsManager.parseUserImportCSV(csvData);
}

export function generateUserImportTemplate() {
  return bulkOperationsManager.generateUserImportTemplate();
}

export function exportUsersToCSV(
  users: UserWithDetails[],
  organizations: Organization[],
  operatingUnits: OperatingUnit[],
  groups: UserGroup[]
) {
  return bulkOperationsManager.exportUsersToCSV(users, organizations, operatingUnits, groups);
}

export function exportGroupsToCSV(
  groups: UserGroup[],
  organizations: Organization[],
  operatingUnits: OperatingUnit[]
) {
  return bulkOperationsManager.exportGroupsToCSV(groups, organizations, operatingUnits);
}

export function exportOperatingUnitsToCSV(
  operatingUnits: OperatingUnit[],
  organizations: Organization[]
) {
  return bulkOperationsManager.exportOperatingUnitsToCSV(operatingUnits, organizations);
}

export function exportOrganizationsToCSV(organizations: Organization[]) {
  return bulkOperationsManager.exportOrganizationsToCSV(organizations);
}

export function validateOrganizationHierarchy(
  users: CreateUserRequest[],
  organizations: Organization[],
  operatingUnits: OperatingUnit[]
) {
  return bulkOperationsManager.validateOrganizationHierarchy(users, organizations, operatingUnits);
}
