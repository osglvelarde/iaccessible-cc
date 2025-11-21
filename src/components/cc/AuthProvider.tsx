"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserWithDetails, User, OperatingUnit, UserGroup, Organization, RoleType, DataAccessScope } from '@/lib/types/users-roles';
import { MOCK_USERS, DEFAULT_OPERATING_UNITS, DEFAULT_ORGANIZATIONS, PREDEFINED_ROLES } from '@/lib/users-roles-defaults';
import { checkModuleAccess, checkFeatureAccess, getEffectiveModulePermissions, getUserDataScope, isOrganizationAdmin, canAccessOrganization } from '@/lib/users-roles-api';
import { setCurrentUserId } from '@/lib/favorites';

interface AuthContextType {
  user: UserWithDetails | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (moduleKey: string, featureKey?: string) => boolean;
  hasAccessLevel: (moduleKey: string, requiredLevel: 'read' | 'write' | 'execute') => boolean;
  getModulePermissions: () => Record<string, 'none' | 'read' | 'write' | 'execute'>;
  isAdmin: () => boolean;
  canManageUsers: () => boolean;
  canManageGroups: () => boolean;
  // NEW organization context
  organization: Organization | null;
  dataScope: DataAccessScope | null;
  isOrganizationAdmin: () => boolean;
  canAccessOrganization: (orgId: string) => boolean;
  getAccessibleOperatingUnits: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users with different roles for testing
const MOCK_USER_CREDENTIALS = [
  { email: 'admin@example.gov', password: 'admin123', role: 'global_admin' },
  { email: 'orgadmin@example.gov', password: 'orgadmin123', role: 'organization_admin' },
  { email: 'manager@example.gov', password: 'manager123', role: 'operating_unit_admin' },
  { email: 'tester@example.gov', password: 'tester123', role: 'remediator_tester' },
  { email: 'viewer@example.gov', password: 'viewer123', role: 'viewer' }
];

// Helper function to create mock user with details
function createMockUserWithDetails(mockUser: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, roleType: string): UserWithDetails {
  // Find the organization for this user's operating unit
  const operatingUnit = DEFAULT_OPERATING_UNITS.find(ou => ou.organizationId === 'org-1') || DEFAULT_OPERATING_UNITS[0];
  const organization = DEFAULT_ORGANIZATIONS.find(org => org.name === 'Federal Agency Alpha') || DEFAULT_ORGANIZATIONS[0];
  
  const operatingUnitWithId: OperatingUnit = {
    id: mockUser.operatingUnitId,
    organizationId: operatingUnit.organizationId,
    name: operatingUnit.name,
    organization: operatingUnit.organization,
    domains: operatingUnit.domains,
    description: operatingUnit.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const organizationWithId: Organization = {
    id: 'org-1',
    name: organization.name,
    slug: organization.slug,
    domains: organization.domains,
    settings: organization.settings,
    status: organization.status,
    billingEmail: organization.billingEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  };

  // Create group based on role
  const roleTemplate = PREDEFINED_ROLES[roleType as keyof typeof PREDEFINED_ROLES];
  const isOrgLevelRole = roleType === 'organization_admin' || roleType === 'global_admin';
  const group: UserGroup = {
    id: `group-${roleType}`,
    name: roleTemplate.name,
    type: 'predefined',
    roleType: roleType as RoleType,
    organizationId: organizationWithId.id,
    operatingUnitId: isOrgLevelRole ? null : mockUser.operatingUnitId,
    scope: isOrgLevelRole ? 'organization' : 'operating_unit',
    permissions: roleTemplate.permissions,
    description: roleTemplate.description,
    isSystemGroup: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  };

  const now = new Date().toISOString();
  const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate effective permissions
  const effectivePermissions = [];
  for (const modulePermission of group.permissions) {
    for (const feature of modulePermission.features) {
      effectivePermissions.push({
        id: `${userId}-${group.id}-${modulePermission.moduleKey}-${feature.featureKey}`,
        moduleKey: modulePermission.moduleKey,
        accessLevel: feature.accessLevel,
        features: [feature],
        grantedBy: 'group' as const,
        grantedById: group.id
      });
    }
  }
  
  return {
    ...mockUser,
    id: userId,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    operatingUnit: operatingUnitWithId,
    organization: organizationWithId,
    groups: [group],
    effectivePermissions
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [dataScope, setDataScope] = useState<DataAccessScope | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('cc.currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setOrganization(userData.organization || null);
          setDataScope(getUserDataScope(userData));
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('cc.currentUser');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find matching credentials
      const credentials = MOCK_USER_CREDENTIALS.find(
        cred => cred.email === email && cred.password === password
      );
      
      if (!credentials) {
        setIsLoading(false);
        return false;
      }

      // Find corresponding mock user
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (!mockUser) {
        setIsLoading(false);
        return false;
      }

      // Create user with details
      const userWithDetails = createMockUserWithDetails(mockUser, credentials.role);
      
      // Update last login
      userWithDetails.lastLogin = new Date().toISOString();
      
      // Store in localStorage (for session only)
      localStorage.setItem('cc.currentUser', JSON.stringify(userWithDetails));
      setUser(userWithDetails);
      setOrganization(userWithDetails.organization);
      setDataScope(getUserDataScope(userWithDetails));
      
      // Set current user ID for API calls
      setCurrentUserId(userWithDetails.id);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('cc.currentUser');
    setUser(null);
    setOrganization(null);
    setDataScope(null);
    setCurrentUserId(null);
  };

  const hasPermission = (moduleKey: string, featureKey?: string): boolean => {
    if (!user) return false;
    
    if (featureKey) {
      return checkFeatureAccess(user, moduleKey, featureKey);
    }
    
    return checkModuleAccess(user, moduleKey);
  };

  const hasAccessLevel = (moduleKey: string, requiredLevel: 'read' | 'write' | 'execute'): boolean => {
    if (!user) return false;
    
    const permissions = getEffectiveModulePermissions(user);
    const userLevel = permissions[moduleKey] || 'none';
    
    const levelHierarchy = { 'none': 0, 'read': 1, 'write': 2, 'execute': 3 };
    return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
  };

  const getModulePermissions = (): Record<string, 'none' | 'read' | 'write' | 'execute'> => {
    if (!user) return {};
    return getEffectiveModulePermissions(user);
  };

  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.groups.some(group => 
      group.roleType === 'global_admin' || 
      group.roleType === 'operating_unit_admin'
    );
  };

  const canManageUsers = (): boolean => {
    if (!user) return false;
    // Only global_admin and organization_admin can manage users
    return user.groups.some(group => 
      group.roleType === 'global_admin' || group.roleType === 'organization_admin'
    );
  };

  const canManageGroups = (): boolean => {
    if (!user) return false;
    // Only global_admin and organization_admin can manage groups
    return user.groups.some(group => 
      group.roleType === 'global_admin' || group.roleType === 'organization_admin'
    );
  };

  const isOrganizationAdminUser = (): boolean => {
    if (!user) return false;
    return isOrganizationAdmin(user);
  };

  const canAccessOrganizationUser = (orgId: string): boolean => {
    if (!user) return false;
    return canAccessOrganization(user, orgId);
  };

  const getAccessibleOperatingUnits = (): string[] => {
    if (!user || !dataScope) return [];
    return dataScope.operatingUnitIds;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAccessLevel,
    getModulePermissions,
    isAdmin,
    canManageUsers,
    canManageGroups,
    organization,
    dataScope,
    isOrganizationAdmin: isOrganizationAdminUser,
    canAccessOrganization: canAccessOrganizationUser,
    getAccessibleOperatingUnits
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for permission checking
export function usePermissions() {
  const { user, hasPermission, hasAccessLevel, getModulePermissions } = useAuth();
  
  return {
    user,
    hasPermission,
    hasAccessLevel,
    getModulePermissions,
    isAuthenticated: !!user
  };
}

// Helper hook for admin functions
export function useAdmin() {
  const { user, isAdmin, canManageUsers, canManageGroups } = useAuth();
  
  return {
    user,
    isAdmin: isAdmin(),
    canManageUsers: canManageUsers(),
    canManageGroups: canManageGroups(),
    isAuthenticated: !!user
  };
}
