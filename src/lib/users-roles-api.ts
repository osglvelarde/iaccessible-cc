import { 
  User, 
  UserWithDetails, 
  UserGroup, 
  OperatingUnit, 
  CreateUserRequest, 
  UpdateUserRequest, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  CreateOperatingUnitRequest, 
  UpdateOperatingUnitRequest,
  UserFilters,
  GroupFilters,
  OperatingUnitFilters,
  UsersResponse,
  GroupsResponse,
  OperatingUnitsResponse,
  Permission,
  AccessLevel
} from './types/users-roles';

// Base API URL
const API_BASE = '/api/users-roles';

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
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
  
  const response = await fetch(`${API_BASE}/users?${params.toString()}`);
  return handleApiResponse<UsersResponse>(response);
}

export async function getUserById(userId: string): Promise<UserWithDetails> {
  const response = await fetch(`${API_BASE}/users?userId=${userId}`);
  return handleApiResponse<UserWithDetails>(response);
}

export async function createUser(userData: CreateUserRequest): Promise<UserWithDetails> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return handleApiResponse<UserWithDetails>(response);
}

export async function updateUser(userId: string, userData: UpdateUserRequest): Promise<UserWithDetails> {
  const response = await fetch(`${API_BASE}/users?userId=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return handleApiResponse<UserWithDetails>(response);
}

export async function deactivateUser(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users?userId=${userId}`, {
    method: 'DELETE'
  });
  await handleApiResponse<{ success: boolean }>(response);
}

// Groups API
export async function getGroups(filters?: GroupFilters): Promise<GroupsResponse> {
  const params = new URLSearchParams();
  if (filters?.operatingUnitId) params.append('operatingUnitId', filters.operatingUnitId);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.search) params.append('search', filters.search);
  
  const response = await fetch(`${API_BASE}/groups?${params.toString()}`);
  return handleApiResponse<GroupsResponse>(response);
}

export async function getGroupById(groupId: string): Promise<UserGroup> {
  const response = await fetch(`${API_BASE}/groups?groupId=${groupId}`);
  return handleApiResponse<UserGroup>(response);
}

export async function createGroup(groupData: CreateGroupRequest): Promise<UserGroup> {
  const response = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(groupData)
  });
  return handleApiResponse<UserGroup>(response);
}

export async function updateGroup(groupId: string, groupData: UpdateGroupRequest): Promise<UserGroup> {
  const response = await fetch(`${API_BASE}/groups?groupId=${groupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(groupData)
  });
  return handleApiResponse<UserGroup>(response);
}

export async function deleteGroup(groupId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/groups?groupId=${groupId}`, {
    method: 'DELETE'
  });
  await handleApiResponse<{ success: boolean }>(response);
}

// Operating Units API
export async function getOperatingUnits(filters?: OperatingUnitFilters): Promise<OperatingUnitsResponse> {
  const params = new URLSearchParams();
  if (filters?.organization) params.append('organization', filters.organization);
  if (filters?.search) params.append('search', filters.search);
  
  const response = await fetch(`${API_BASE}/operating-units?${params.toString()}`);
  return handleApiResponse<OperatingUnitsResponse>(response);
}

export async function getOperatingUnitById(ouId: string): Promise<OperatingUnit> {
  const response = await fetch(`${API_BASE}/operating-units?ouId=${ouId}`);
  return handleApiResponse<OperatingUnit>(response);
}

export async function createOperatingUnit(ouData: CreateOperatingUnitRequest): Promise<OperatingUnit> {
  const response = await fetch(`${API_BASE}/operating-units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ouData)
  });
  return handleApiResponse<OperatingUnit>(response);
}

export async function updateOperatingUnit(ouId: string, ouData: UpdateOperatingUnitRequest): Promise<OperatingUnit> {
  const response = await fetch(`${API_BASE}/operating-units?ouId=${ouId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ouData)
  });
  return handleApiResponse<OperatingUnit>(response);
}

export async function deleteOperatingUnit(ouId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/operating-units?ouId=${ouId}`, {
    method: 'DELETE'
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
