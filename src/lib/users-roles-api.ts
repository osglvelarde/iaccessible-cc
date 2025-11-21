import { 
  UserWithDetails, 
  UserGroup, 
  OperatingUnit, 
  Organization,
  CreateUserRequest, 
  UpdateUserRequest, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  CreateOperatingUnitRequest, 
  UpdateOperatingUnitRequest,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  UserFilters,
  GroupFilters,
  OperatingUnitFilters,
  OrganizationFilters,
  UsersResponse,
  GroupsResponse,
  OperatingUnitsResponse,
  OrganizationsResponse,
  Permission,
  AccessLevel,
  DataAccessScope
} from './types/users-roles';
import { getCurrentUserId, setCurrentUserId } from './favorites';

// Base API URL
const API_BASE = '/api/users-roles';

// Helper to get headers with user ID
function getHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  // Try multiple methods to get user ID - always check localStorage first for reliability
  let userId: string | null = null;
  
  // Method 1: Try localStorage first (most reliable)
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('cc.currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData?.id) {
          userId = userData.id;
          // Also set it for future calls
          setCurrentUserId(userData.id);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
      console.warn('Error reading user from localStorage:', e);
    }
  }
  
  // Method 2: Fallback to getCurrentUserId() if localStorage didn't work
  if (!userId) {
    userId = getCurrentUserId();
  }
  
  if (userId) {
    headers['x-user-id'] = userId;
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Sending request with user ID:', userId);
    }
  } else {
    console.error('[API] No user ID found for API request. User may not be authenticated.');
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('cc.currentUser');
      console.error('[API] localStorage check:', storedUser ? 'User data exists' : 'No user data');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.error('[API] User data:', { id: userData?.id, email: userData?.email });
        } catch (e) {
          console.error('[API] Error parsing user data:', e);
        }
      }
    }
    console.error('[API] getCurrentUserId():', getCurrentUserId());
  }
  
  return headers;
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    // Include validation details if available
    const errorMessage = error.message || error.error || `HTTP ${response.status}`;
    const errorWithDetails = error.details 
      ? `${errorMessage}: ${Array.isArray(error.details) ? error.details.join(', ') : error.details}`
      : errorMessage;
    throw new Error(errorWithDetails);
  }
  return response.json();
}

// Users API
export async function getUsers(filters?: UserFilters): Promise<UsersResponse> {
  const params = new URLSearchParams();
  if (filters?.operatingUnitId) params.append('operatingUnitId', filters.operatingUnitId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.groupId) params.append('groupId', filters.groupId);
  if (filters?.search) params.append('search', filters.search);
  
  const headers = getHeaders();
  // Debug: Log the actual headers being sent
  if (process.env.NODE_ENV === 'development') {
    console.log('[API getUsers] Headers:', headers);
    console.log('[API getUsers] URL:', `${API_BASE}/users?${params.toString()}`);
  }
  
  const response = await fetch(`${API_BASE}/users?${params.toString()}`, {
    headers
  });
  return handleApiResponse<UsersResponse>(response);
}

export async function getUserById(userId: string): Promise<UserWithDetails> {
  const response = await fetch(`${API_BASE}/users?userId=${userId}`);
  return handleApiResponse<UserWithDetails>(response);
}

export async function createUser(userData: CreateUserRequest): Promise<UserWithDetails> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  return handleApiResponse<UserWithDetails>(response);
}

export async function updateUser(userId: string, userData: UpdateUserRequest): Promise<UserWithDetails> {
  const response = await fetch(`${API_BASE}/users?userId=${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  return handleApiResponse<UserWithDetails>(response);
}

export async function deactivateUser(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users?userId=${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  await handleApiResponse<{ success: boolean }>(response);
}

// Groups API
export async function getGroups(filters?: GroupFilters): Promise<GroupsResponse> {
  const params = new URLSearchParams();
  if (filters?.operatingUnitId) params.append('operatingUnitId', filters.operatingUnitId);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.search) params.append('search', filters.search);
  
  const response = await fetch(`${API_BASE}/groups?${params.toString()}`, {
    headers: getHeaders()
  });
  return handleApiResponse<GroupsResponse>(response);
}

export async function getGroupById(groupId: string): Promise<UserGroup> {
  const response = await fetch(`${API_BASE}/groups?groupId=${groupId}`);
  return handleApiResponse<UserGroup>(response);
}

export async function createGroup(groupData: CreateGroupRequest): Promise<UserGroup> {
  const response = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(groupData)
  });
  return handleApiResponse<UserGroup>(response);
}

export async function updateGroup(groupId: string, groupData: UpdateGroupRequest): Promise<UserGroup> {
  const response = await fetch(`${API_BASE}/groups?groupId=${groupId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(groupData)
  });
  return handleApiResponse<UserGroup>(response);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/groups?groupId=${groupId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  await handleApiResponse<{ success: boolean }>(response);
}

// Operating Units API
export async function getOperatingUnits(filters?: OperatingUnitFilters): Promise<OperatingUnitsResponse> {
  const params = new URLSearchParams();
  if (filters?.organization) params.append('organization', filters.organization);
  if (filters?.search) params.append('search', filters.search);
  
  const response = await fetch(`${API_BASE}/operating-units?${params.toString()}`, {
    headers: getHeaders()
  });
  return handleApiResponse<OperatingUnitsResponse>(response);
}

export async function getOperatingUnitById(ouId: string): Promise<OperatingUnit> {
  const response = await fetch(`${API_BASE}/operating-units?ouId=${ouId}`);
  return handleApiResponse<OperatingUnit>(response);
}

export async function createOperatingUnit(ouData: CreateOperatingUnitRequest): Promise<OperatingUnit> {
  const response = await fetch(`${API_BASE}/operating-units`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(ouData)
  });
  return handleApiResponse<OperatingUnit>(response);
}

export async function updateOperatingUnit(ouId: string, ouData: UpdateOperatingUnitRequest): Promise<OperatingUnit> {
  const response = await fetch(`${API_BASE}/operating-units?ouId=${ouId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(ouData)
  });
  return handleApiResponse<OperatingUnit>(response);
}

export async function deleteOperatingUnit(ouId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/operating-units?ouId=${ouId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  await handleApiResponse<{ success: boolean }>(response);
}

// Organizations API
export async function getOrganizations(filters?: OrganizationFilters): Promise<OrganizationsResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  
  const response = await fetch(`${API_BASE}/organizations?${params.toString()}`, {
    headers: getHeaders()
  });
  return handleApiResponse<OrganizationsResponse>(response);
}

export async function getOrganizationById(orgId: string): Promise<Organization> {
  const response = await fetch(`${API_BASE}/organizations?orgId=${orgId}`);
  return handleApiResponse<Organization>(response);
}

export async function createOrganization(orgData: CreateOrganizationRequest): Promise<Organization> {
  const response = await fetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(orgData)
  });
  return handleApiResponse<Organization>(response);
}

export async function updateOrganization(orgId: string, orgData: UpdateOrganizationRequest): Promise<Organization> {
  const response = await fetch(`${API_BASE}/organizations?orgId=${orgId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(orgData)
  });
  return handleApiResponse<Organization>(response);
}

export async function deleteOrganization(orgId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/organizations?orgId=${orgId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  await handleApiResponse<{ success: boolean }>(response);
}

// Permission checking utilities
export function getUserPermissions(user: UserWithDetails): Permission[] {
  return user.effectivePermissions || [];
}

export function checkModuleAccess(user: UserWithDetails, moduleKey: string): boolean {
  const permissions = getUserPermissions(user);
  return permissions.some(p => 
    p.moduleKey === moduleKey && 
    ['read', 'write', 'execute'].includes(p.accessLevel)
  );
}

export function checkFeatureAccess(user: UserWithDetails, moduleKey: string, featureKey: string): boolean {
  const permissions = getUserPermissions(user);
  return permissions.some(p => 
    p.moduleKey === moduleKey && 
    p.features.some(f => f.featureKey === featureKey && ['read', 'write', 'execute'].includes(f.accessLevel))
  );
}

export function checkAccessLevel(user: UserWithDetails, moduleKey: string, requiredLevel: AccessLevel): boolean {
  const permissions = getUserPermissions(user);
  const modulePermission = permissions.find(p => p.moduleKey === moduleKey);
  
  if (!modulePermission) return false;
  
  const levelHierarchy: Record<AccessLevel, number> = {
    'none': 0,
    'read': 1,
    'write': 2,
    'execute': 3
  };
  
  return levelHierarchy[modulePermission.accessLevel] >= levelHierarchy[requiredLevel];
}

export function getEffectiveModulePermissions(user: UserWithDetails): Record<string, AccessLevel> {
  const permissions = getUserPermissions(user);
  const modulePermissions: Record<string, AccessLevel> = {};
  
  permissions.forEach(permission => {
    const currentLevel = modulePermissions[permission.moduleKey];
    const levelHierarchy: Record<AccessLevel, number> = {
      'none': 0,
      'read': 1,
      'write': 2,
      'execute': 3
    };
    
    if (!currentLevel || levelHierarchy[permission.accessLevel] > levelHierarchy[currentLevel]) {
      modulePermissions[permission.moduleKey] = permission.accessLevel;
    }
  });
  
  return modulePermissions;
}

// Helper function to check if user has admin permissions
export function isAdmin(user: UserWithDetails): boolean {
  return user.groups.some(group => 
    group.roleType === 'global_admin' || 
    group.roleType === 'operating_unit_admin'
  );
}

// Helper function to check if user can manage users
export function canManageUsers(user: UserWithDetails): boolean {
  return checkModuleAccess(user, 'usersRoles') && 
         checkFeatureAccess(user, 'usersRoles', 'create_users');
}

// Helper function to check if user can manage groups
export function canManageGroups(user: UserWithDetails): boolean {
  return checkModuleAccess(user, 'usersRoles') && 
         checkFeatureAccess(user, 'usersRoles', 'manage_groups');
}

// Helper function to check if user can access operating unit
export function canAccessOperatingUnit(user: UserWithDetails, operatingUnitId: string): boolean {
  // Global admins can access all operating units
  if (user.groups.some(group => group.roleType === 'global_admin')) {
    return true;
  }
  
  // Org admins can access all OUs in their org
  const isOrgAdmin = user.groups.some(g => g.roleType === 'organization_admin');
  if (isOrgAdmin) {
    // For now, assume they can access OUs in their organization
    // In production, you'd check the OU's organizationId
    return true;
  }
  
  // Other users can only access their own operating unit
  return user.operatingUnitId === operatingUnitId;
}

// Cache for permission checks (simple in-memory cache)
const permissionCache = new Map<string, { permissions: Permission[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedUserPermissions(userId: string): Permission[] | null {
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  return null;
}

export function setCachedUserPermissions(userId: string, permissions: Permission[]): void {
  permissionCache.set(userId, {
    permissions,
    timestamp: Date.now()
  });
}

export function clearUserPermissionCache(userId?: string): void {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

// Data scoping utilities
export function getUserDataScope(user: UserWithDetails): DataAccessScope {
  const isGlobalAdmin = user.groups.some(group => group.roleType === 'global_admin');
  const isOrgAdmin = user.groups.some(group => group.roleType === 'organization_admin');
  
  if (isGlobalAdmin) {
    return {
      organizationIds: [], // Empty means all organizations
      operatingUnitIds: [], // Empty means all operating units
      canViewAllInOrg: true
    };
  }
  
  if (isOrgAdmin) {
    return {
      organizationIds: [user.organization.id],
      operatingUnitIds: [], // Empty means all OUs in the org
      canViewAllInOrg: true
    };
  }
  
  // Regular users can only see their own operating unit
  return {
    organizationIds: [user.organization.id],
    operatingUnitIds: [user.operatingUnitId],
    canViewAllInOrg: false
  };
}

export function canAccessOrganization(user: UserWithDetails, organizationId: string): boolean {
  const isGlobalAdmin = user.groups.some(group => group.roleType === 'global_admin');
  return isGlobalAdmin || user.organization.id === organizationId;
}

export function canAccessOperatingUnitsInOrg(user: UserWithDetails, organizationId: string): string[] {
  const isGlobalAdmin = user.groups.some(group => group.roleType === 'global_admin');
  const isOrgAdmin = user.groups.some(group => group.roleType === 'organization_admin');
  
  if (isGlobalAdmin) {
    return []; // Empty means all OUs
  }
  
  if (isOrgAdmin && user.organization.id === organizationId) {
    return []; // Empty means all OUs in the org
  }
  
  if (user.organization.id === organizationId) {
    return [user.operatingUnitId];
  }
  
  return [];
}

export function isOrganizationAdmin(user: UserWithDetails): boolean {
  return user.groups.some(group => group.roleType === 'organization_admin');
}

