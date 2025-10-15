export type AccessLevel = 'none' | 'read' | 'write' | 'execute';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export type GroupType = 'predefined' | 'custom';

export type RoleType = 
  | 'viewer'
  | 'administrator' 
  | 'global_admin'
  | 'remediator_tester'
  | 'operating_unit_admin';

export interface FeaturePermission {
  featureKey: string;
  featureName: string;
  accessLevel: AccessLevel;
  description?: string;
}

export interface ModulePermission {
  moduleKey: string;
  moduleName: string;
  accessLevel: AccessLevel;
  features: FeaturePermission[];
}

export interface Permission {
  id: string;
  moduleKey: string;
  accessLevel: AccessLevel;
  features: FeaturePermission[];
  grantedBy: 'user' | 'group';
  grantedById: string;
}

export interface OperatingUnit {
  id: string;
  name: string;
  organization: string;
  domains: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroup {
  id: string;
  name: string;
  type: GroupType;
  roleType?: RoleType; // Only for predefined groups
  operatingUnitId: string;
  permissions: ModulePermission[];
  description?: string;
  isSystemGroup: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  operatingUnitId: string;
  groupIds: string[];
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  invitedBy?: string;
  invitationToken?: string;
  invitationExpiresAt?: string;
}

export interface UserWithDetails extends User {
  operatingUnit: OperatingUnit;
  groups: UserGroup[];
  effectivePermissions: Permission[];
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  operatingUnitId: string;
  groupIds: string[];
  sendInvitation?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  operatingUnitId?: string;
  groupIds?: string[];
  status?: UserStatus;
}

export interface CreateGroupRequest {
  name: string;
  operatingUnitId: string;
  permissions: ModulePermission[];
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  permissions?: ModulePermission[];
  description?: string;
}

export interface CreateOperatingUnitRequest {
  name: string;
  organization: string;
  domains: string[];
  description?: string;
}

export interface UpdateOperatingUnitRequest {
  name?: string;
  organization?: string;
  domains?: string[];
  description?: string;
}

export interface UserFilters {
  operatingUnitId?: string;
  status?: UserStatus;
  groupId?: string;
  search?: string;
}

export interface GroupFilters {
  operatingUnitId?: string;
  type?: GroupType;
  search?: string;
}

export interface OperatingUnitFilters {
  organization?: string;
  search?: string;
}

export interface UsersResponse {
  users: UserWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GroupsResponse {
  groups: UserGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OperatingUnitsResponse {
  operatingUnits: OperatingUnit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Module feature definitions for granular permissions
export interface ModuleFeatures {
  [moduleKey: string]: {
    moduleName: string;
    features: {
      [featureKey: string]: {
        name: string;
        description: string;
        requiresWrite?: boolean; // Some features require write access to module
      };
    };
  };
}

// Audit log types
export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: 'user' | 'group' | 'operating_unit';
  resourceId: string;
  actorId: string;
  actorEmail: string;
  changes?: Record<string, { from: any; to: any }>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
