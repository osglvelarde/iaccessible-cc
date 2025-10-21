"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { OperatingUnit, Organization, CreateOperatingUnitRequest, UpdateOperatingUnitRequest } from '@/lib/types/users-roles';
import { createOperatingUnit, updateOperatingUnit } from '@/lib/users-roles-api';

interface OperatingUnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatingUnit?: OperatingUnit | null;
  organizations: Organization[];
  onSuccess: (unit: OperatingUnit) => void;
}

export default function OperatingUnitFormDialog({
  open,
  onOpenChange,
  operatingUnit,
  organizations,
  onSuccess
}: OperatingUnitFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    organizationId: '',
    domains: [] as string[],
    description: ''
  });
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!operatingUnit;

  useEffect(() => {
    if (operatingUnit) {
      setFormData({
        name: operatingUnit.name,
        organizationId: operatingUnit.organizationId,
        domains: operatingUnit.domains,
        description: operatingUnit.description || ''
      });
    } else {
      setFormData({
        name: '',
        organizationId: organizations[0]?.id || '',
        domains: [],
        description: ''
      });
    }
    setNewDomain('');
    setError(null);
  }, [operatingUnit, organizations, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.organizationId) {
      setError('Name and organization are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && operatingUnit) {
        const updateData: UpdateOperatingUnitRequest = {
          name: formData.name,
          organization: organizations.find(org => org.id === formData.organizationId)?.name || '',
          organizationId: formData.organizationId,
          domains: formData.domains,
          description: formData.description || undefined
        };
        const updatedUnit = await updateOperatingUnit(operatingUnit.id, updateData);
        onSuccess(updatedUnit);
      } else {
        const createData: CreateOperatingUnitRequest = {
          name: formData.name,
          organization: organizations.find(org => org.id === formData.organizationId)?.name || '',
          organizationId: formData.organizationId,
          domains: formData.domains,
          description: formData.description || undefined
        };
        const newUnit = await createOperatingUnit(createData);
        onSuccess(newUnit);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDomain = () => {
    if (newDomain.trim() && !formData.domains.includes(newDomain.trim())) {
      setFormData(prev => ({
        ...prev,
        domains: [...prev.domains, newDomain.trim()]
      }));
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.filter(domain => domain !== domainToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Operating Unit' : 'Create Operating Unit'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the operating unit details below.'
              : 'Create a new operating unit and assign it to an organization.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter operating unit name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization *</Label>
            <Select
              value={formData.organizationId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter operating unit description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Domains</Label>
            <div className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter domain (e.g., example.com)"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDomain}
                disabled={!newDomain.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.domains.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.domains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
