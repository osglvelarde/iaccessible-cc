export type AccessLevel = 'none' | 'read' | 'write' | 'execute';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export type GroupType = 'predefined' | 'custom';

export type RoleType = 
  | 'viewer'
  | 'administrator' 
  | 'global_admin'
  | 'remediator_tester'
  | 'operating_unit_admin'
  | 'organization_admin';

export interface OrganizationSettings {
  allowCustomGroups: boolean;
  maxUsers: number;
  maxOperatingUnits: number;
  features: string[]; // Feature flags
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  domains: string[]; // Primary domains for this org
  settings: OrganizationSettings;
  status: 'active' | 'inactive' | 'trial';
  billingEmail?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

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
  organizationId: string; // NEW - reference to parent org
  name: string;
  organization: string; // Keep for backward compatibility, but rename to 'department'
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
  organizationId: string; // NEW
  operatingUnitId: string | null; // Now nullable for org-level groups
  scope: 'organization' | 'operating_unit'; // NEW - defines permission scope
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
  organization: Organization; // NEW
  groups: UserGroup[];
  effectivePermissions: Permission[];
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
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
  organizationId: string;
  operatingUnitId?: string | null;
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
  organizationId?: string;
  domains: string[];
  description?: string;
}

export interface UpdateOperatingUnitRequest {
  name?: string;
  organization?: string;
  organizationId?: string;
  domains?: string[];
  description?: string;
}

export interface UserFilters {
  organizationId?: string;
  operatingUnitId?: string;
  status?: UserStatus;
  groupId?: string;
  search?: string;
}

export interface GroupFilters {
  organizationId?: string;
  operatingUnitId?: string;
  type?: GroupType;
  search?: string;
}

export interface OperatingUnitFilters {
  organization?: string;
  organizationId?: string; // NEW
  search?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  domains: string[];
  settings?: Partial<OrganizationSettings>;
  billingEmail?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  domains?: string[];
  settings?: Partial<OrganizationSettings>;
  status?: 'active' | 'inactive' | 'trial';
  billingEmail?: string;
}

export interface OrganizationFilters {
  status?: 'active' | 'inactive' | 'trial';
  search?: string;
}

export interface DataAccessScope {
  organizationIds: string[];
  operatingUnitIds: string[];
  canViewAllInOrg: boolean; // True for org admins
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

export interface OrganizationsResponse {
  organizations: Organization[];
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
  resourceType: 'user' | 'group' | 'operating_unit' | 'organization';
  resourceId: string;
  organizationId: string; // NEW
  actorId: string;
  actorEmail: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
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

// Permission inheritance types
export interface PermissionInheritanceRule {
  id: string;
  organizationId: string;
  sourceScope: 'organization' | 'operating_unit';
  targetScope: 'operating_unit';
  moduleKey: string;
  inheritLevel: 'full' | 'partial' | 'none';
  restrictions?: {
    features?: string[];
    accessLevel?: AccessLevel;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface InheritedPermission {
  moduleKey: string;
  moduleName: string;
  accessLevel: AccessLevel;
  features: FeaturePermission[];
  inheritedFrom: 'organization' | 'operating_unit';
  inheritedFromId: string;
  inheritanceRule?: PermissionInheritanceRule;
}

export interface PermissionInheritanceConfig {
  organizationId: string;
  enableInheritance: boolean;
  defaultInheritanceLevel: 'full' | 'partial' | 'none';
  rules: PermissionInheritanceRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInheritanceRuleRequest {
  organizationId: string;
  sourceScope: 'organization' | 'operating_unit';
  targetScope: 'operating_unit';
  moduleKey: string;
  inheritLevel: 'full' | 'partial' | 'none';
  restrictions?: {
    features?: string[];
    accessLevel?: AccessLevel;
  };
}

export interface UpdateInheritanceRuleRequest {
  sourceScope?: 'organization' | 'operating_unit';
  targetScope?: 'operating_unit';
  moduleKey?: string;
  inheritLevel?: 'full' | 'partial' | 'none';
  restrictions?: {
    features?: string[];
    accessLevel?: AccessLevel;
  };
}
