"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Search, 
  Shield, 
  Users, 
  Settings, 
  Copy,
  Edit,
  Trash2,
  Lock
} from 'lucide-react';
import { UserGroup, ModulePermission } from '@/lib/types/users-roles';
import { PREDEFINED_ROLES } from '@/lib/users-roles-defaults';

interface GroupManagementPanelProps {
  groups: UserGroup[];
  onGroupsChange: (groups: UserGroup[]) => void;
  canManageGroups: boolean;
}

export default function GroupManagementPanel({ 
  groups, 
  onGroupsChange, 
  canManageGroups 
}: GroupManagementPanelProps) {
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter groups based on search
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateGroup = () => {
    // TODO: Implement create group dialog
    console.log('Create new group');
  };

  const handleEditGroup = (group: UserGroup) => {
    // TODO: Implement edit group dialog
    console.log('Edit group:', group.id);
  };

  const handleDeleteGroup = (group: UserGroup) => {
    // TODO: Implement delete group confirmation
    console.log('Delete group:', group.id);
  };

  const handleCloneGroup = (group: UserGroup) => {
    // TODO: Implement clone group functionality
    console.log('Clone group:', group.id);
  };

  const getGroupTypeBadgeVariant = (type: string, isSystemGroup: boolean) => {
    if (isSystemGroup) return 'default';
    if (type === 'predefined') return 'secondary';
    return 'outline';
  };

  const getPermissionCount = (group: UserGroup) => {
    return group.permissions.reduce((count, module) => 
      count + module.features.length, 0
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Groups List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Groups ({filteredGroups.length})</CardTitle>
            {canManageGroups && (
              <Button onClick={handleCreateGroup} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGroup?.id === group.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{group.name}</h4>
                        {group.isSystemGroup && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={getGroupTypeBadgeVariant(group.type, group.isSystemGroup)}>
                          {group.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getPermissionCount(group)} permissions
                        </span>
                      </div>
                    </div>
                    {canManageGroups && !group.isSystemGroup && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloneGroup(group);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No groups found
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Group Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedGroup ? selectedGroup.name : 'Select a Group'}
          </CardTitle>
          {selectedGroup && (
            <p className="text-sm text-muted-foreground">
              {selectedGroup.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {selectedGroup ? (
            <div className="space-y-4">
              {/* Group Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge 
                    variant={getGroupTypeBadgeVariant(selectedGroup.type, selectedGroup.isSystemGroup)}
                    className="ml-2"
                  >
                    {selectedGroup.type}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Permissions:</span>
                  <span className="ml-2 text-muted-foreground">
                    {getPermissionCount(selectedGroup)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(selectedGroup.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(selectedGroup.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions
                </h4>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {selectedGroup.permissions.map((modulePermission) => (
                      <div key={modulePermission.moduleKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">
                            {modulePermission.moduleName}
                          </h5>
                          <Badge variant="outline">
                            {modulePermission.accessLevel}
                          </Badge>
                        </div>
                        <div className="ml-4 space-y-1">
                          {modulePermission.features.map((feature) => (
                            <div 
                              key={feature.featureKey}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <span>{feature.featureName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {feature.accessLevel}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              {canManageGroups && !selectedGroup.isSystemGroup && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditGroup(selectedGroup)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit Group
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCloneGroup(selectedGroup)}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Clone Group
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a group to view details and permissions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
