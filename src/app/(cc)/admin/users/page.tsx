"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Building2, Shield, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/cc/AuthProvider';
import { getUsers, getGroups, getOperatingUnits, getOrganizations } from '@/lib/users-roles-api';
import { UserWithDetails, UserGroup, OperatingUnit, Organization } from '@/lib/types/users-roles';
import UserManagementTable from '@/components/cc/users-roles/UserManagementTable';
import GroupManagementPanel from '@/components/cc/users-roles/GroupManagementPanel';
import OperatingUnitManagement from '@/components/cc/users-roles/OperatingUnitManagement';
import OrganizationManagement from '@/components/cc/users-roles/OrganizationManagement';
import UserFormDialog from '@/components/cc/users-roles/UserFormDialog';

export default function UsersRolesAdminPage() {
  const { user, canManageUsers, canManageGroups } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [operatingUnits, setOperatingUnits] = useState<OperatingUnit[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    totalOperatingUnits: 0,
    totalOrganizations: 0,
    activeOrganizations: 0
  });

  // Load data on mount - wait for user to be available
  useEffect(() => {
    // Don't load data if user is not available yet
    if (!user) {
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [usersResponse, groupsResponse, operatingUnitsResponse, organizationsResponse] = await Promise.all([
          getUsers(),
          getGroups(),
          getOperatingUnits(),
          getOrganizations()
        ]);

        setUsers(usersResponse.users);
        setGroups(groupsResponse.groups);
        setOperatingUnits(operatingUnitsResponse.operatingUnits);
        setOrganizations(organizationsResponse.organizations);

        setStats({
          totalUsers: usersResponse.total,
          activeUsers: usersResponse.users.filter(u => u.status === 'active').length,
          totalGroups: groupsResponse.total,
          totalOperatingUnits: operatingUnitsResponse.total,
          totalOrganizations: organizationsResponse.total,
          activeOrganizations: organizationsResponse.organizations.filter(o => o.status === 'active').length
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleUserCreated = (newUser: UserWithDetails) => {
    setUsers(prev => [newUser, ...prev]);
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + 1,
      activeUsers: newUser.status === 'active' ? prev.activeUsers + 1 : prev.activeUsers
    }));
  };

  // Check if user has permission to access this page
  // Only global_admin and organization_admin can access users & roles
  const isAdmin = user?.groups.some(group => 
    group.roleType === 'global_admin' || group.roleType === 'organization_admin'
  );

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center mb-4">
              You don&apos;t have permission to access the Users & Roles administration.
              <br />
              Only administrators can access this page.
            </p>
            <Button asChild>
              <Link href="/">Return to Command Center</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to Command Center
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users & Roles Administration</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, groups, and permissions across your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Groups</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {groups.filter(g => g.type === 'custom').length} custom
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOperatingUnits}</div>
            <p className="text-xs text-muted-foreground">
              Across organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOrganizations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.groups[0]?.name || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.operatingUnit.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="operating-units" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Operating Units
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <OrganizationManagement 
            organizations={organizations}
            onOrganizationsChange={setOrganizations}
            canManage={canManageUsers()}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">User Management</h2>
              <p className="text-muted-foreground">
                Manage user accounts, permissions, and access levels.
              </p>
            </div>
            {canManageUsers() && (
              <Button onClick={() => setShowUserDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            )}
          </div>
          
          <UserManagementTable 
            users={users}
            canManageUsers={canManageUsers()}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Group Management</h2>
              <p className="text-muted-foreground">
                Create and manage user groups with specific permissions.
              </p>
            </div>
            {canManageGroups() && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            )}
          </div>
          
          <GroupManagementPanel 
            groups={groups}
            onGroupsChange={setGroups}
            canManageGroups={canManageGroups()}
            organizations={organizations}
            operatingUnits={operatingUnits}
          />
        </TabsContent>

        <TabsContent value="operating-units" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Operating Unit Management</h2>
              <p className="text-muted-foreground">
                Manage organizational units and their domains.
              </p>
            </div>
            {canManageUsers() && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Operating Unit
              </Button>
            )}
          </div>
          
          <OperatingUnitManagement 
            operatingUnits={operatingUnits}
            organizations={organizations}
            onOperatingUnitsChange={setOperatingUnits}
            canManage={canManageUsers()}
          />
        </TabsContent>
      </Tabs>

      {/* User Form Dialog */}
      <UserFormDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        onUserCreated={handleUserCreated}
        operatingUnits={operatingUnits}
        groups={groups}
      />
    </div>
  );
}
