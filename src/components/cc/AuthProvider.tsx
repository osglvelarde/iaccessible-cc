"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserWithDetails, User, OperatingUnit, UserGroup, RoleType } from '@/lib/types/users-roles';
import { MOCK_USERS, DEFAULT_OPERATING_UNITS, PREDEFINED_ROLES } from '@/lib/users-roles-defaults';
import { checkModuleAccess, checkFeatureAccess, getEffectiveModulePermissions } from '@/lib/users-roles-api';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users with different roles for testing
const MOCK_USER_CREDENTIALS = [
  { email: 'admin@example.gov', password: 'admin123', role: 'global_admin' },
  { email: 'manager@example.gov', password: 'manager123', role: 'operating_unit_admin' },
  { email: 'tester@example.gov', password: 'tester123', role: 'remediator_tester' },
  { email: 'viewer@example.gov', password: 'viewer123', role: 'viewer' },
  { email: 'test.user@example.gov', password: 'Test1234', role: 'administrator' }
];

// Helper function to create mock user with details
function createMockUserWithDetails(mockUser: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, roleType: string): UserWithDetails {
  const operatingUnit: OperatingUnit = {
    id: mockUser.operatingUnitId,
    name: 'Digital Services',
    organization: 'Department of Technology',
    domains: ['tech.gov', 'digital.gov'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Create group based on role
  const roleTemplate = PREDEFINED_ROLES[roleType as keyof typeof PREDEFINED_ROLES];
  const group: UserGroup = {
    id: `group-${roleType}`,
    name: roleTemplate.name,
    type: 'predefined',
    roleType: roleType as RoleType,
    operatingUnitId: mockUser.operatingUnitId,
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
    operatingUnit,
    groups: [group],
    effectivePermissions
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('cc.currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
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
      
      // Store in localStorage
      localStorage.setItem('cc.currentUser', JSON.stringify(userWithDetails));
      setUser(userWithDetails);
      
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
    return hasPermission('usersRoles', 'create_users');
  };

  const canManageGroups = (): boolean => {
    return hasPermission('usersRoles', 'manage_groups');
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
    canManageGroups
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
