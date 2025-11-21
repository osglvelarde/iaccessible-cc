import { NextRequest, NextResponse } from 'next/server';
import * as UserModel from '@/lib/models/User';
import * as GroupModel from '@/lib/models/Group';
import * as OperatingUnitModel from '@/lib/models/OperatingUnit';
import * as OrganizationModel from '@/lib/models/Organization';
import { UserWithDetails, Permission } from '@/lib/types/users-roles';

/**
 * Get user ID from request headers
 * In production, this should come from session/JWT token
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id') || 
                 new URL(request.url).searchParams.get('userId');
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('[Auth] Request headers:', allHeaders);
    console.log('[Auth] Extracted user ID:', userId);
  }
  
  return userId;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<UserWithDetails | null> {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return null;
  }
  
  try {
    let user = await UserModel.getUserById(userId);
    
    // In development, if user doesn't exist in MongoDB but has a mock user ID pattern,
    // create a temporary mock user for authentication
    if (!user && process.env.NODE_ENV === 'development' && userId.startsWith('user-')) {
      console.log('[Auth] Mock user detected, creating temporary global_admin user for development');
      
      // Import mock data
      const { MOCK_USERS, DEFAULT_OPERATING_UNITS, DEFAULT_ORGANIZATIONS, PREDEFINED_ROLES } = await import('@/lib/users-roles-defaults');
      
      // Find admin mock user template
      const mockUserTemplate = MOCK_USERS.find(u => u.email === 'admin@example.gov') || MOCK_USERS[0];
      if (!mockUserTemplate) {
        console.error('[Auth] No mock user template found');
        return null;
      }
      
      // Create a basic user object for development with global_admin role
      const now = new Date().toISOString();
      user = {
        ...mockUserTemplate,
        id: userId,
        groupIds: ['group-global_admin'], // Assign global_admin group
        createdAt: now,
        updatedAt: now,
        createdBy: 'system'
      };
      
      console.log('[Auth] Created temporary mock user:', { id: user.id, email: user.email });
    }
    
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] User not found in database:', userId);
      }
      return null;
    }
    
    // Enrich user with details (groups, permissions, etc.)
    const [groups, operatingUnits, organizations] = await Promise.all([
      GroupModel.getAllGroups(),
      OperatingUnitModel.getAllOperatingUnits(),
      OrganizationModel.getAllOrganizations()
    ]);

    // For mock users in development, create the group if it doesn't exist
    let userGroups = groups.filter(group => user.groupIds.includes(group.id));
    
    // If no groups found and this is a mock user, create a global_admin group
    if (userGroups.length === 0 && process.env.NODE_ENV === 'development' && userId.startsWith('user-')) {
      const { PREDEFINED_ROLES } = await import('@/lib/users-roles-defaults');
      const roleTemplate = PREDEFINED_ROLES.global_admin;
      const globalAdminGroup = {
        id: 'group-global_admin',
        name: roleTemplate.name,
        type: 'predefined' as const,
        roleType: 'global_admin' as const,
        organizationId: 'org-1',
        operatingUnitId: null,
        scope: 'organization' as const,
        permissions: roleTemplate.permissions,
        description: roleTemplate.description,
        isSystemGroup: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };
      userGroups = [globalAdminGroup];
      console.log('[Auth] Created temporary global_admin group for mock user');
    }
    
    const operatingUnit = operatingUnits.find(ou => ou.id === user.operatingUnitId);
    const organization = operatingUnit ? organizations.find(org => org.id === operatingUnit.organizationId) : null;

    // Calculate effective permissions
    const effectivePermissions: Permission[] = [];
    for (const group of userGroups) {
      for (const modulePermission of group.permissions) {
        for (const feature of modulePermission.features) {
          effectivePermissions.push({
            id: `${user.id}-${group.id}-${modulePermission.moduleKey}-${feature.featureKey}`,
            moduleKey: modulePermission.moduleKey,
            accessLevel: feature.accessLevel,
            features: [feature],
            grantedBy: 'group' as const,
            grantedById: group.id
          });
        }
      }
    }

    return {
      ...user,
      operatingUnit: operatingUnit || { 
        id: user.operatingUnitId, 
        organizationId: 'org-1',
        name: 'Unknown', 
        organization: 'Unknown', 
        domains: [], 
        createdAt: '', 
        updatedAt: '' 
      },
      organization: organization || {
        id: 'org-1',
        name: 'Unknown Organization',
        slug: 'unknown',
        domains: [],
        settings: {
          allowCustomGroups: true,
          maxUsers: 100,
          maxOperatingUnits: 10,
          features: []
        },
        status: 'active',
        createdAt: '',
        updatedAt: '',
        createdBy: 'system'
      },
      groups: userGroups,
      effectivePermissions
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Check if user is a global admin
 */
export function isGlobalAdmin(user: UserWithDetails | null): boolean {
  if (!user) return false;
  return user.groups.some(group => group.roleType === 'global_admin');
}

/**
 * Check if user is an organization admin
 */
export function isOrganizationAdmin(user: UserWithDetails | null): boolean {
  if (!user) return false;
  return user.groups.some(group => group.roleType === 'organization_admin');
}

/**
 * Check if user can manage users and roles (admin only)
 */
export function canManageUsersAndRoles(user: UserWithDetails | null): boolean {
  if (!user) return false;
  // Only global_admin and organization_admin can manage users and roles
  return isGlobalAdmin(user) || isOrganizationAdmin(user);
}

/**
 * Require admin authentication for API routes
 * Returns the authenticated admin user or throws an error response
 */
export async function requireAdminAuth(request: NextRequest): Promise<{ user: UserWithDetails; response?: never } | { user?: never; response: NextResponse }> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      response: new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  if (!canManageUsersAndRoles(user)) {
    return {
      response: new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  return { user };
}

