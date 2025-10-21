import { 
  UserWithDetails, 
  DataAccessScope, 
  Organization, 
  OperatingUnit 
} from '@/lib/types/users-roles';

// Data scoping utilities for filtering data based on user's organization and OU access
export class DataScopingManager {
  /**
   * Filter scans based on user's data access scope
   */
  filterScans<T extends { organizationId: string; operatingUnitId: string }>(
    scans: T[],
    user: UserWithDetails
  ): T[] {
    const dataScope = this.getUserDataScope(user);
    
    return scans.filter(scan => {
      // Global admins can see all scans
      if (dataScope.canViewAllInOrg) {
        return dataScope.organizationIds.includes(scan.organizationId);
      }
      
      // Organization admins can see all scans in their organization
      if (dataScope.organizationIds.includes(scan.organizationId)) {
        return dataScope.operatingUnitIds.includes(scan.operatingUnitId);
      }
      
      return false;
    });
  }

  /**
   * Filter dashboards based on user's data access scope
   */
  filterDashboards<T extends { organizationId: string; operatingUnitId: string }>(
    dashboards: T[],
    user: UserWithDetails
  ): T[] {
    const dataScope = this.getUserDataScope(user);
    
    return dashboards.filter(dashboard => {
      // Global admins can see all dashboards
      if (dataScope.canViewAllInOrg) {
        return dataScope.organizationIds.includes(dashboard.organizationId);
      }
      
      // Organization admins can see all dashboards in their organization
      if (dataScope.organizationIds.includes(dashboard.organizationId)) {
        return dataScope.operatingUnitIds.includes(dashboard.operatingUnitId);
      }
      
      return false;
    });
  }

  /**
   * Filter reports based on user's data access scope
   */
  filterReports<T extends { organizationId: string; operatingUnitId: string }>(
    reports: T[],
    user: UserWithDetails
  ): T[] {
    const dataScope = this.getUserDataScope(user);
    
    return reports.filter(report => {
      // Global admins can see all reports
      if (dataScope.canViewAllInOrg) {
        return dataScope.organizationIds.includes(report.organizationId);
      }
      
      // Organization admins can see all reports in their organization
      if (dataScope.organizationIds.includes(report.organizationId)) {
        return dataScope.operatingUnitIds.includes(report.operatingUnitId);
      }
      
      return false;
    });
  }

  /**
   * Filter users based on user's data access scope
   */
  filterUsers<T extends { organizationId: string; operatingUnitId: string }>(
    users: T[],
    user: UserWithDetails
  ): T[] {
    const dataScope = this.getUserDataScope(user);
    
    return users.filter(targetUser => {
      // Global admins can see all users
      if (dataScope.canViewAllInOrg) {
        return dataScope.organizationIds.includes(targetUser.organizationId);
      }
      
      // Organization admins can see all users in their organization
      if (dataScope.organizationIds.includes(targetUser.organizationId)) {
        return dataScope.operatingUnitIds.includes(targetUser.operatingUnitId);
      }
      
      return false;
    });
  }

  /**
   * Filter any data with organization and operating unit IDs
   */
  filterData<T extends { organizationId: string; operatingUnitId: string }>(
    data: T[],
    user: UserWithDetails
  ): T[] {
    const dataScope = this.getUserDataScope(user);
    
    return data.filter(item => {
      // Global admins can see all data
      if (dataScope.canViewAllInOrg) {
        return dataScope.organizationIds.includes(item.organizationId);
      }
      
      // Organization admins can see all data in their organization
      if (dataScope.organizationIds.includes(item.organizationId)) {
        return dataScope.operatingUnitIds.includes(item.operatingUnitId);
      }
      
      return false;
    });
  }

  /**
   * Get user's data access scope
   */
  getUserDataScope(user: UserWithDetails): DataAccessScope {
    const isGlobalAdmin = user.groups.some(group => group.roleType === 'global_admin');
    const isOrgAdmin = user.groups.some(group => group.roleType === 'organization_admin');
    
    if (isGlobalAdmin) {
      // Global admins can access all organizations and operating units
      return {
        organizationIds: [], // Empty means all organizations
        operatingUnitIds: [], // Empty means all operating units
        canViewAllInOrg: true
      };
    }
    
    if (isOrgAdmin) {
      // Organization admins can access all OUs in their organization
      const organizationId = user.organization?.id;
      if (organizationId) {
        return {
          organizationIds: [organizationId],
          operatingUnitIds: [], // Empty means all OUs in the organization
          canViewAllInOrg: true
        };
      }
    }
    
    // Regular users can only access their own operating unit
    return {
      organizationIds: user.organization?.id ? [user.organization.id] : [],
      operatingUnitIds: user.operatingUnitId ? [user.operatingUnitId] : [],
      canViewAllInOrg: false
    };
  }

  /**
   * Check if user can access specific organization
   */
  canAccessOrganization(user: UserWithDetails, organizationId: string): boolean {
    const dataScope = this.getUserDataScope(user);
    
    // Global admins can access all organizations
    if (dataScope.canViewAllInOrg && dataScope.organizationIds.length === 0) {
      return true;
    }
    
    return dataScope.organizationIds.includes(organizationId);
  }

  /**
   * Check if user can access specific operating unit
   */
  canAccessOperatingUnit(user: UserWithDetails, operatingUnitId: string): boolean {
    const dataScope = this.getUserDataScope(user);
    
    // Global admins can access all operating units
    if (dataScope.canViewAllInOrg && dataScope.operatingUnitIds.length === 0) {
      return true;
    }
    
    return dataScope.operatingUnitIds.includes(operatingUnitId);
  }

  /**
   * Get accessible operating units for a user within an organization
   */
  getAccessibleOperatingUnitsInOrg(
    user: UserWithDetails, 
    organizationId: string,
    allOperatingUnits: OperatingUnit[]
  ): OperatingUnit[] {
    const dataScope = this.getUserDataScope(user);
    
    // Check if user can access this organization
    if (!this.canAccessOrganization(user, organizationId)) {
      return [];
    }
    
    // Filter operating units based on user's access
    return allOperatingUnits.filter(ou => {
      if (ou.organizationId !== organizationId) {
        return false;
      }
      
      // Global admins can access all OUs
      if (dataScope.canViewAllInOrg && dataScope.operatingUnitIds.length === 0) {
        return true;
      }
      
      // Organization admins can access all OUs in their org
      if (dataScope.canViewAllInOrg && dataScope.organizationIds.includes(organizationId)) {
        return true;
      }
      
      // Regular users can only access their assigned OU
      return dataScope.operatingUnitIds.includes(ou.id);
    });
  }

  /**
   * Get accessible organizations for a user
   */
  getAccessibleOrganizations(
    user: UserWithDetails,
    allOrganizations: Organization[]
  ): Organization[] {
    const dataScope = this.getUserDataScope(user);
    
    // Global admins can access all organizations
    if (dataScope.canViewAllInOrg && dataScope.organizationIds.length === 0) {
      return allOrganizations;
    }
    
    // Filter organizations based on user's access
    return allOrganizations.filter(org => 
      dataScope.organizationIds.includes(org.id)
    );
  }

  /**
   * Create data scoping filter for API queries
   */
  createDataScopeFilter(user: UserWithDetails): {
    organizationIds?: string[];
    operatingUnitIds?: string[];
    canViewAllInOrg: boolean;
  } {
    const dataScope = this.getUserDataScope(user);
    
    return {
      organizationIds: dataScope.organizationIds.length > 0 ? dataScope.organizationIds : undefined,
      operatingUnitIds: dataScope.operatingUnitIds.length > 0 ? dataScope.operatingUnitIds : undefined,
      canViewAllInOrg: dataScope.canViewAllInOrg
    };
  }

  /**
   * Apply data scoping to API query parameters
   */
  applyDataScopeToQuery(
    queryParams: Record<string, any>,
    user: UserWithDetails
  ): Record<string, any> {
    const dataScope = this.getUserDataScope(user);
    const scopedParams = { ...queryParams };
    
    // Add organization filter if user doesn't have global access
    if (!dataScope.canViewAllInOrg || dataScope.organizationIds.length > 0) {
      if (dataScope.organizationIds.length > 0) {
        scopedParams.organizationId = dataScope.organizationIds[0]; // For single org access
      }
    }
    
    // Add operating unit filter if user doesn't have org-wide access
    if (!dataScope.canViewAllInOrg || dataScope.operatingUnitIds.length > 0) {
      if (dataScope.operatingUnitIds.length > 0) {
        scopedParams.operatingUnitId = dataScope.operatingUnitIds[0]; // For single OU access
      }
    }
    
    return scopedParams;
  }

  /**
   * Validate data access before performing operations
   */
  validateDataAccess(
    user: UserWithDetails,
    resource: { organizationId: string; operatingUnitId: string },
    operation: 'read' | 'write' | 'delete' = 'read'
  ): { allowed: boolean; reason?: string } {
    // Check organization access
    if (!this.canAccessOrganization(user, resource.organizationId)) {
      return {
        allowed: false,
        reason: 'User does not have access to this organization'
      };
    }
    
    // Check operating unit access
    if (!this.canAccessOperatingUnit(user, resource.operatingUnitId)) {
      return {
        allowed: false,
        reason: 'User does not have access to this operating unit'
      };
    }
    
    // Additional permission checks could be added here based on operation type
    // For now, we'll just check data scope access
    
    return { allowed: true };
  }
}

// Export singleton instance
export const dataScopingManager = new DataScopingManager();

// Utility functions for common use cases
export function filterScansByUserAccess<T extends { organizationId: string; operatingUnitId: string }>(
  scans: T[],
  user: UserWithDetails
): T[] {
  return dataScopingManager.filterScans(scans, user);
}

export function filterDashboardsByUserAccess<T extends { organizationId: string; operatingUnitId: string }>(
  dashboards: T[],
  user: UserWithDetails
): T[] {
  return dataScopingManager.filterDashboards(dashboards, user);
}

export function filterReportsByUserAccess<T extends { organizationId: string; operatingUnitId: string }>(
  reports: T[],
  user: UserWithDetails
): T[] {
  return dataScopingManager.filterReports(reports, user);
}

export function filterUsersByUserAccess<T extends { organizationId: string; operatingUnitId: string }>(
  users: T[],
  user: UserWithDetails
): T[] {
  return dataScopingManager.filterUsers(users, user);
}

export function getUserDataScope(user: UserWithDetails): DataAccessScope {
  return dataScopingManager.getUserDataScope(user);
}

export function canAccessOrganization(user: UserWithDetails, organizationId: string): boolean {
  return dataScopingManager.canAccessOrganization(user, organizationId);
}

export function canAccessOperatingUnit(user: UserWithDetails, operatingUnitId: string): boolean {
  return dataScopingManager.canAccessOperatingUnit(user, operatingUnitId);
}

export function createDataScopeFilter(user: UserWithDetails) {
  return dataScopingManager.createDataScopeFilter(user);
}

export function applyDataScopeToQuery(queryParams: Record<string, any>, user: UserWithDetails) {
  return dataScopingManager.applyDataScopeToQuery(queryParams, user);
}

export function validateDataAccess(
  user: UserWithDetails,
  resource: { organizationId: string; operatingUnitId: string },
  operation: 'read' | 'write' | 'delete' = 'read'
) {
  return dataScopingManager.validateDataAccess(user, resource, operation);
}
