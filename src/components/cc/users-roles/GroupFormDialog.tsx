"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2 } from 'lucide-react';
import { 
  UserGroup, 
  Organization, 
  OperatingUnit, 
  CreateGroupRequest, 
  UpdateGroupRequest,
  ModulePermission,
  AccessLevel,
  FeaturePermission
} from '@/lib/types/users-roles';
import { createGroup, updateGroup } from '@/lib/users-roles-api';

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: UserGroup | null;
  organizations: Organization[];
  operatingUnits: OperatingUnit[];
  onSuccess: (group: UserGroup) => void;
}

// Mock module permissions - in a real app, this would come from an API
const AVAILABLE_MODULES: ModulePermission[] = [
  {
    moduleKey: 'users',
    moduleName: 'User Management',
    accessLevel: 'read' as AccessLevel,
    features: [
      { featureKey: 'view_users', featureName: 'View Users', accessLevel: 'read' as AccessLevel },
      { featureKey: 'create_users', featureName: 'Create Users', accessLevel: 'write' as AccessLevel },
      { featureKey: 'edit_users', featureName: 'Edit Users', accessLevel: 'write' as AccessLevel },
      { featureKey: 'delete_users', featureName: 'Delete Users', accessLevel: 'admin' as AccessLevel }
    ]
  },
  {
    moduleKey: 'groups',
    moduleName: 'Group Management',
    accessLevel: 'read' as AccessLevel,
    features: [
      { featureKey: 'view_groups', featureName: 'View Groups', accessLevel: 'read' as AccessLevel },
      { featureKey: 'create_groups', featureName: 'Create Groups', accessLevel: 'write' as AccessLevel },
      { featureKey: 'edit_groups', featureName: 'Edit Groups', accessLevel: 'write' as AccessLevel },
      { featureKey: 'delete_groups', featureName: 'Delete Groups', accessLevel: 'admin' as AccessLevel }
    ]
  },
  {
    moduleKey: 'scans',
    moduleName: 'Scan Management',
    accessLevel: 'read' as AccessLevel,
    features: [
      { featureKey: 'view_scans', featureName: 'View Scans', accessLevel: 'read' as AccessLevel },
      { featureKey: 'create_scans', featureName: 'Create Scans', accessLevel: 'write' as AccessLevel },
      { featureKey: 'edit_scans', featureName: 'Edit Scans', accessLevel: 'write' as AccessLevel },
      { featureKey: 'delete_scans', featureName: 'Delete Scans', accessLevel: 'admin' as AccessLevel }
    ]
  },
  {
    moduleKey: 'reports',
    moduleName: 'Reports',
    accessLevel: 'read' as AccessLevel,
    features: [
      { featureKey: 'view_reports', featureName: 'View Reports', accessLevel: 'read' as AccessLevel },
      { featureKey: 'create_reports', featureName: 'Create Reports', accessLevel: 'write' as AccessLevel },
      { featureKey: 'export_reports', featureName: 'Export Reports', accessLevel: 'write' as AccessLevel }
    ]
  }
];

export default function GroupFormDialog({
  open,
  onOpenChange,
  group,
  organizations,
  operatingUnits,
  onSuccess
}: GroupFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organizationId: '',
    operatingUnitId: '',
    scope: 'operating_unit' as 'organization' | 'operating_unit',
    permissions: [] as ModulePermission[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!group;

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        organizationId: group.organizationId,
        operatingUnitId: group.operatingUnitId || '',
        scope: group.scope,
        permissions: group.permissions
      });
    } else {
      setFormData({
        name: '',
        description: '',
        organizationId: organizations[0]?.id || '',
        operatingUnitId: '',
        scope: 'operating_unit',
        permissions: []
      });
    }
    setError(null);
  }, [group, organizations, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.organizationId) {
      setError('Name and organization are required');
      return;
    }

    if (formData.scope === 'operating_unit' && !formData.operatingUnitId) {
      setError('Operating unit is required for operating unit scope');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && group) {
        const updateData: UpdateGroupRequest = {
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions
        };
        const updatedGroup = await updateGroup(group.id, updateData);
        onSuccess(updatedGroup);
      } else {
        const createData: CreateGroupRequest = {
          name: formData.name,
          organizationId: formData.organizationId,
          operatingUnitId: formData.scope === 'operating_unit' ? formData.operatingUnitId : null,
          permissions: formData.permissions,
          description: formData.description || undefined
        };
        const newGroup = await createGroup(createData);
        onSuccess(newGroup);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModuleToggle = (moduleKey: string, checked: boolean) => {
    if (checked) {
      const moduleItem = AVAILABLE_MODULES.find(m => m.moduleKey === moduleKey);
      if (moduleItem) {
        setFormData(prev => ({
          ...prev,
          permissions: [...prev.permissions, { ...moduleItem, accessLevel: 'read' as AccessLevel }]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p.moduleKey !== moduleKey)
      }));
    }
  };

  const handleModuleAccessLevelChange = (moduleKey: string, accessLevel: AccessLevel) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.moduleKey === moduleKey ? { ...p, accessLevel } : p
      )
    }));
  };

  const handleFeatureToggle = (moduleKey: string, featureKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => {
        if (p.moduleKey === moduleKey) {
          const updatedFeatures = checked
            ? [...p.features, { featureKey, featureName: '', accessLevel: 'read' as AccessLevel }]
            : p.features.filter(f => f.featureKey !== featureKey);
          return { ...p, features: updatedFeatures };
        }
        return p;
      })
    }));
  };

  const handleFeatureAccessLevelChange = (moduleKey: string, featureKey: string, accessLevel: AccessLevel) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => {
        if (p.moduleKey === moduleKey) {
          return {
            ...p,
            features: p.features.map(f => 
              f.featureKey === featureKey ? { ...f, accessLevel } : f
            )
          };
        }
        return p;
      })
    }));
  };

  const getFilteredOperatingUnits = () => {
    if (formData.scope === 'organization') return [];
    return operatingUnits.filter(ou => ou.organizationId === formData.organizationId);
  };

  const isModuleSelected = (moduleKey: string) => {
    return formData.permissions.some(p => p.moduleKey === moduleKey);
  };

  const getModulePermission = (moduleKey: string) => {
    return formData.permissions.find(p => p.moduleKey === moduleKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Group' : 'Create Group'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the group details and permissions below.'
              : 'Create a new group and configure its permissions.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: 'organization' | 'operating_unit') => 
                  setFormData(prev => ({ ...prev, scope: value, operatingUnitId: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization-wide
                    </div>
                  </SelectItem>
                  <SelectItem value="operating_unit">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Operating Unit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter group description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Select
                value={formData.organizationId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value, operatingUnitId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.scope === 'operating_unit' && (
              <div className="space-y-2">
                <Label htmlFor="operatingUnit">Operating Unit *</Label>
                <Select
                  value={formData.operatingUnitId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, operatingUnitId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operating unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredOperatingUnits().map((ou) => (
                      <SelectItem key={ou.id} value={ou.id}>
                        {ou.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </Label>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {AVAILABLE_MODULES.map((moduleItem) => {
                  const isSelected = isModuleSelected(moduleItem.moduleKey);
                  const modulePermission = getModulePermission(moduleItem.moduleKey);

                  return (
                    <Card key={moduleItem.moduleKey}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`module-${moduleItem.moduleKey}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleModuleToggle(moduleItem.moduleKey, checked as boolean)}
                            />
                            <Label htmlFor={`module-${moduleItem.moduleKey}`} className="font-medium">
                              {moduleItem.moduleName}
                            </Label>
                          </div>
                          {isSelected && modulePermission && (
                            <Select
                              value={modulePermission.accessLevel}
                              onValueChange={(value: AccessLevel) => 
                                handleModuleAccessLevelChange(moduleItem.moduleKey, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="read">Read</SelectItem>
                                <SelectItem value="write">Write</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardHeader>
                      {isSelected && modulePermission && (
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {moduleItem.features.map((feature) => {
                              const isFeatureSelected = modulePermission.features.some(f => f.featureKey === feature.featureKey);
                              const featurePermission = modulePermission.features.find(f => f.featureKey === feature.featureKey);

                              return (
                                <div key={feature.featureKey} className="flex items-center justify-between pl-6">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`feature-${feature.featureKey}`}
                                      checked={isFeatureSelected}
                                      onCheckedChange={(checked) => 
                                        handleFeatureToggle(moduleItem.moduleKey, feature.featureKey, checked as boolean)
                                      }
                                    />
                                    <Label htmlFor={`feature-${feature.featureKey}`} className="text-sm">
                                      {feature.featureName}
                                    </Label>
                                  </div>
                                  {isFeatureSelected && featurePermission && (
                                    <Select
                                      value={featurePermission.accessLevel}
                                      onValueChange={(value: AccessLevel) => 
                                        handleFeatureAccessLevelChange(moduleItem.moduleKey, feature.featureKey, value)
                                      }
                                    >
                                      <SelectTrigger className="w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="read">Read</SelectItem>
                                        <SelectItem value="write">Write</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
