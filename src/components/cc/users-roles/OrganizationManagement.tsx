"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Building2, Users, Settings } from 'lucide-react';
import { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '@/lib/types/users-roles';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '@/lib/users-roles-api';
import { useAuth } from '@/components/cc/AuthProvider';

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
            <DialogContent className="max-w-2xl">
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
          <DialogContent className="max-w-2xl">
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
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    domains: organization?.domains.join(', ') || '',
    status: (organization?.status || 'active') as 'active' | 'inactive' | 'trial',
    billingEmail: organization?.billingEmail || '',
    maxUsers: organization?.settings.maxUsers || 100,
    maxOperatingUnits: organization?.settings.maxOperatingUnits || 10,
    allowCustomGroups: organization?.settings.allowCustomGroups ?? true,
    features: organization?.settings.features.join(', ') || 'web_scan,pdf_scan'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      name: formData.name,
      slug: formData.slug,
      domains: formData.domains.split(',').map(d => d.trim()).filter(Boolean),
      status: formData.status as 'active' | 'inactive' | 'trial',
      billingEmail: formData.billingEmail || undefined,
      settings: {
        maxUsers: formData.maxUsers,
        maxOperatingUnits: formData.maxOperatingUnits,
        allowCustomGroups: formData.allowCustomGroups,
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
      }
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="domains">Domains (comma-separated)</Label>
        <Input
          id="domains"
          value={formData.domains}
          onChange={(e) => setFormData(prev => ({ ...prev, domains: e.target.value }))}
          placeholder="example.gov, subdomain.example.gov"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
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
        <div>
          <Label htmlFor="billingEmail">Billing Email</Label>
          <Input
            id="billingEmail"
            type="email"
            value={formData.billingEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxUsers">Max Users</Label>
          <Input
            id="maxUsers"
            type="number"
            value={formData.maxUsers}
            onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="maxOperatingUnits">Max Operating Units</Label>
          <Input
            id="maxOperatingUnits"
            type="number"
            value={formData.maxOperatingUnits}
            onChange={(e) => setFormData(prev => ({ ...prev, maxOperatingUnits: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Features (comma-separated)</Label>
        <Input
          id="features"
          value={formData.features}
          onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
          placeholder="web_scan, pdf_scan, manual_testing"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="allowCustomGroups"
          checked={formData.allowCustomGroups}
          onChange={(e) => setFormData(prev => ({ ...prev, allowCustomGroups: e.target.checked }))}
        />
        <Label htmlFor="allowCustomGroups">Allow Custom Groups</Label>
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
