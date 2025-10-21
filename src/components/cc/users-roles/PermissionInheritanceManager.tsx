"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  Shield,
  ArrowRight,
  Building2
} from 'lucide-react';
import { 
  PermissionInheritanceConfig,
  PermissionInheritanceRule,
  CreateInheritanceRuleRequest
} from '@/lib/types/users-roles';

interface PermissionInheritanceManagerProps {
  organizationId: string;
  organizationName: string;
  canManage: boolean;
}

export default function PermissionInheritanceManager({ 
  organizationId, 
  organizationName,
  canManage 
}: PermissionInheritanceManagerProps) {
  const [config, setConfig] = useState<PermissionInheritanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<PermissionInheritanceRule | null>(null);
  const [ruleForm, setRuleForm] = useState<CreateInheritanceRuleRequest>({
    organizationId,
    sourceScope: 'organization',
    targetScope: 'operating_unit',
    moduleKey: '',
    inheritLevel: 'partial',
    restrictions: {
      accessLevel: 'read'
    }
  });

  const loadInheritanceConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users-roles/permission-inheritance?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading inheritance config:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Load inheritance configuration
  useEffect(() => {
    loadInheritanceConfig();
  }, [organizationId, loadInheritanceConfig]);

  const updateConfig = async (updates: Partial<PermissionInheritanceConfig>) => {
    if (!config) return;

    try {
      const updatedConfig = { ...config, ...updates };
      const response = await fetch(`/api/users-roles/permission-inheritance?organizationId=${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setConfig(updatedConfig);
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const createRule = async () => {
    try {
      const response = await fetch('/api/users-roles/permission-inheritance/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });

      if (response.ok) {
        await loadInheritanceConfig();
        setShowRuleDialog(false);
        setRuleForm({
          organizationId,
          sourceScope: 'organization',
          targetScope: 'operating_unit',
          moduleKey: '',
          inheritLevel: 'partial',
          restrictions: { accessLevel: 'read' }
        });
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<PermissionInheritanceRule>) => {
    try {
      const response = await fetch(`/api/users-roles/permission-inheritance/rules?ruleId=${ruleId}&organizationId=${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadInheritanceConfig();
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/users-roles/permission-inheritance/rules?ruleId=${ruleId}&organizationId=${organizationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadInheritanceConfig();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleEditRule = (rule: PermissionInheritanceRule) => {
    setEditingRule(rule);
    setRuleForm({
      organizationId,
      sourceScope: rule.sourceScope,
      targetScope: rule.targetScope,
      moduleKey: rule.moduleKey,
      inheritLevel: rule.inheritLevel,
      restrictions: rule.restrictions
    });
    setShowRuleDialog(true);
  };

  const handleSaveRule = async () => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleForm);
    } else {
      await createRule();
    }
  };

  const getInheritLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'full': return 'default';
      case 'partial': return 'secondary';
      case 'none': return 'outline';
      default: return 'outline';
    }
  };

  const getAccessLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'execute': return 'default';
      case 'write': return 'secondary';
      case 'read': return 'outline';
      case 'none': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading inheritance configuration...</div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load inheritance configuration
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Inheritance Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure how permissions are inherited from organization to operating units
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enable-inheritance">Enable Permission Inheritance</Label>
              <p className="text-sm text-muted-foreground">
                Allow operating units to inherit permissions from organization-level groups
              </p>
            </div>
            <Switch
              id="enable-inheritance"
              checked={config.enableInheritance}
              onCheckedChange={(checked) => updateConfig({ enableInheritance: checked })}
              disabled={!canManage}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Inheritance Level</Label>
              <Select
                value={config.defaultInheritanceLevel}
                onValueChange={(value: 'full' | 'partial' | 'none') => 
                  updateConfig({ defaultInheritanceLevel: value })
                }
                disabled={!canManage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Inheritance</SelectItem>
                  <SelectItem value="partial">Partial Inheritance</SelectItem>
                  <SelectItem value="none">No Inheritance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Organization</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">{organizationName}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inheritance Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inheritance Rules</CardTitle>
            {canManage && (
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingRule(null);
                    setRuleForm({
                      organizationId,
                      sourceScope: 'organization',
                      targetScope: 'operating_unit',
                      moduleKey: '',
                      inheritLevel: 'partial',
                      restrictions: { accessLevel: 'read' }
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? 'Edit Inheritance Rule' : 'Create Inheritance Rule'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure how permissions are inherited for a specific module
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Module</Label>
                      <Input
                        placeholder="e.g., usersRoles, scans, reports"
                        value={ruleForm.moduleKey}
                        onChange={(e) => setRuleForm({ ...ruleForm, moduleKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inheritance Level</Label>
                      <Select
                        value={ruleForm.inheritLevel}
                        onValueChange={(value: 'full' | 'partial' | 'none') => 
                          setRuleForm({ ...ruleForm, inheritLevel: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Inheritance</SelectItem>
                          <SelectItem value="partial">Partial Inheritance</SelectItem>
                          <SelectItem value="none">No Inheritance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {ruleForm.inheritLevel === 'partial' && (
                      <div className="space-y-2">
                        <Label>Access Level Restriction</Label>
                        <Select
                          value={ruleForm.restrictions?.accessLevel || 'read'}
                          onValueChange={(value: 'read' | 'write' | 'execute') => 
                            setRuleForm({ 
                              ...ruleForm, 
                              restrictions: { 
                                ...ruleForm.restrictions, 
                                accessLevel: value 
                              } 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">Read Only</SelectItem>
                            <SelectItem value="write">Read & Write</SelectItem>
                            <SelectItem value="execute">Full Access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveRule}>
                      {editingRule ? 'Update Rule' : 'Create Rule'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {config.rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inheritance rules configured</p>
              <p className="text-sm">Create rules to define how permissions are inherited</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Restrictions</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.moduleKey}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.sourceScope}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{rule.targetScope}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getInheritLevelBadgeVariant(rule.inheritLevel)}>
                        {rule.inheritLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rule.restrictions?.accessLevel && (
                        <Badge variant={getAccessLevelBadgeVariant(rule.restrictions.accessLevel)}>
                          Max: {rule.restrictions.accessLevel}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
