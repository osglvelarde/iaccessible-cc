"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Building2, Users, Settings, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '@/lib/types/users-roles';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '@/lib/users-roles-api';
import { useAuth } from '@/components/cc/AuthProvider';
import FeatureSelector from './FeatureSelector';

interface OrganizationManagementProps {
  organizations: Organization[];
  onOrganizationsChange: (organizations: Organization[]) => void;
  canManage: boolean;
}

export default function OrganizationManagement({ 
  organizations, 
  onOrganizationsChange, 
  canManage 
}: OrganizationManagementProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter organizations based on search and status
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.domains.some(domain => domain.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrganization = async (orgData: CreateOrganizationRequest) => {
    if (!canManage) return;
    
    setIsLoading(true);
    try {
      const newOrg = await createOrganization(orgData);
      onOrganizationsChange([...organizations, newOrg]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrganization = async (orgId: string, orgData: UpdateOrganizationRequest) => {
    if (!canManage) return;
    
    setIsLoading(true);
    try {
      const updatedOrg = await updateOrganization(orgId, orgData);
      onOrganizationsChange(organizations.map(org => 
        org.id === orgId ? updatedOrg : org
      ));
      setEditingOrg(null);
    } catch (error) {
      console.error('Error updating organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationSubmit = async (data: CreateOrganizationRequest | UpdateOrganizationRequest) => {
    if (editingOrg) {
      await handleUpdateOrganization(editingOrg.id, data as UpdateOrganizationRequest);
    } else {
      await handleCreateOrganization(data as CreateOrganizationRequest);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!canManage) return;
    
    if (!confirm('Are you sure you want to deactivate this organization? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteOrganization(orgId);
      onOrganizationsChange(organizations.map(org => 
        org.id === orgId ? { ...org, status: 'inactive' as const } : org
      ));
    } catch (error) {
      console.error('Error deleting organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'trial': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Organizations</h2>
          <p className="text-muted-foreground">
            Manage organizations and their settings.
          </p>
        </div>
        {canManage && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
              </DialogHeader>
              <OrganizationForm
                onSubmit={handleOrganizationSubmit}
                onCancel={() => setShowCreateDialog(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Created</TableHead>
                {canManage && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {org.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {org.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {org.domains.slice(0, 2).map((domain, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                      {org.domains.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{org.domains.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(org.status)}>
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {org.settings.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {org.settings.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{org.settings.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingOrg(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrganization(org.id)}
                          disabled={org.status === 'inactive'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingOrg && (
        <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>
            <OrganizationForm
              organization={editingOrg}
              onSubmit={handleOrganizationSubmit}
              onCancel={() => setEditingOrg(null)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Organization Form Component
interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationRequest | UpdateOrganizationRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function OrganizationForm({ organization, onSubmit, onCancel, isLoading }: OrganizationFormProps) {
  return (
    <TooltipProvider>
      <OrganizationFormContent 
        organization={organization}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
      />
    </TooltipProvider>
  );
}

function OrganizationFormContent({ organization, onSubmit, onCancel, isLoading }: OrganizationFormProps) {
  // Initialize features as an array to avoid string conversion issues
  const initialFeatures = organization?.settings.features || ['web_scan', 'pdf_scan'];
  
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    domains: organization?.domains.join(', ') || '',
    status: (organization?.status || 'active') as 'active' | 'inactive' | 'trial',
    billingEmail: organization?.billingEmail || '',
    maxUsers: organization?.settings.maxUsers || 100,
    maxOperatingUnits: organization?.settings.maxOperatingUnits || 10,
    allowCustomGroups: organization?.settings.allowCustomGroups ?? true,
    features: initialFeatures
  });
  
  // Ref to track previous features to prevent unnecessary updates
  const prevFeaturesRef = useRef<string[]>(initialFeatures);
  const isUpdatingRef = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract domains from URLs if needed
    const extractDomainFromInput = (input: string): string => {
      const trimmed = input.trim();
      if (!trimmed) return '';
      
      try {
        // If it's a URL, extract the domain
        if (trimmed.match(/^https?:\/\//i)) {
          const url = new URL(trimmed);
          return url.hostname;
        }
        // If it has a path, try to parse as URL
        if (trimmed.includes('/')) {
          const url = new URL('http://' + trimmed);
          return url.hostname;
        }
      } catch (e) {
        // Not a valid URL, treat as domain
      }
      
      return trimmed.toLowerCase();
    };

    // Prepare submit data - only include status for updates
    const submitData: any = {
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      domains: formData.domains.split(',').map(d => extractDomainFromInput(d)).filter(Boolean),
      billingEmail: formData.billingEmail.trim() || undefined,
      settings: {
        maxUsers: formData.maxUsers,
        maxOperatingUnits: formData.maxOperatingUnits,
        allowCustomGroups: formData.allowCustomGroups,
        features: formData.features
      }
    };

    // Only include status for updates
    if (organization) {
      submitData.status = formData.status;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The official name of the organization. This will be displayed throughout the system.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>A URL-friendly identifier for the organization. Used in URLs and must be unique. Auto-formatted to lowercase with hyphens.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                // Auto-format slug: lowercase, replace spaces with hyphens, remove invalid chars
                const formatted = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '');
                setFormData(prev => ({ ...prev, slug: formatted }));
              }}
              placeholder="my-organization"
              required
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="domains">Domains (comma-separated)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>List of domains associated with this organization. You can enter domain names (example.gov) or full URLs (https://www.example.com). URLs will be automatically converted to domains.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="domains"
            value={formData.domains}
            onChange={(e) => setFormData(prev => ({ ...prev, domains: e.target.value }))}
            placeholder="example.gov, subdomain.example.gov, https://www.example.com"
          />
          <p className="text-xs text-muted-foreground">
            Enter domain names (e.g., example.gov) or full URLs (e.g., https://www.example.com). URLs will be automatically converted to domains.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="status">Status</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Organization status: Active (fully operational), Inactive (disabled), or Trial (temporary access for evaluation).</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'trial' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email address for billing and administrative communications. Optional but recommended for account management.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="billingEmail"
              type="email"
              value={formData.billingEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="maxUsers">Max Users</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of users allowed in this organization. This helps manage licensing and resource allocation.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="maxUsers"
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="maxOperatingUnits">Max Operating Units</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of operating units that can be created under this organization. Operating units are sub-divisions within an organization.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="maxOperatingUnits"
              type="number"
              value={formData.maxOperatingUnits}
              onChange={(e) => setFormData(prev => ({ ...prev, maxOperatingUnits: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Features</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Select the features to enable for this organization. These features control which capabilities are available to users in this organization.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <FeatureSelector
            selectedFeatures={formData.features}
            onFeaturesChange={useCallback((features: string[]) => {
              // Prevent recursive updates
              if (isUpdatingRef.current) {
                return;
              }
              
              // Sort features for consistency
              const sortedFeatures = [...features].sort();
              const newStr = sortedFeatures.join(',');
              const prevStr = [...prevFeaturesRef.current].sort().join(',');
              
              // Only update if actually different
              if (prevStr !== newStr) {
                isUpdatingRef.current = true;
                prevFeaturesRef.current = [...sortedFeatures]; // Store a copy
                
                // Use a microtask to defer the state update
                Promise.resolve().then(() => {
                  setFormData(prev => {
                    // Double-check we still need to update
                    const currentStr = [...prev.features].sort().join(',');
                    if (currentStr !== newStr) {
                      return { ...prev, features: sortedFeatures };
                    }
                    return prev;
                  });
                  
                  // Reset flag after state update
                  setTimeout(() => {
                    isUpdatingRef.current = false;
                  }, 0);
                });
              }
            }, [])}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="allowCustomGroups"
            checked={formData.allowCustomGroups}
            onChange={(e) => setFormData(prev => ({ ...prev, allowCustomGroups: e.target.checked }))}
            className="h-4 w-4"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="allowCustomGroups" className="cursor-pointer">Allow Custom Groups</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>When enabled, administrators can create custom user groups with specific permissions beyond the predefined roles.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : organization ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
