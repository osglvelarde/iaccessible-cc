"use client";
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Organization, OperatingUnit } from '@/lib/types/users-roles';
import { getOrganizations, getOperatingUnits } from '@/lib/users-roles-api';
import { useAuth } from '@/components/cc/AuthProvider';

interface OrganizationSelectorProps {
  selectedOrganizationId?: string;
  selectedOperatingUnitId?: string;
  onOrganizationChange: (orgId: string | undefined) => void;
  onOperatingUnitChange: (ouId: string | undefined) => void;
  showOperatingUnits?: boolean;
  className?: string;
}

export default function OrganizationSelector({
  selectedOrganizationId,
  selectedOperatingUnitId,
  onOrganizationChange,
  onOperatingUnitChange,
  showOperatingUnits = true,
  className
}: OrganizationSelectorProps) {
  const { user, isOrganizationAdmin, canAccessOrganization } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [operatingUnits, setOperatingUnits] = useState<OperatingUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load organizations and operating units
  useEffect(() => {
    const loadData = async () => {
      try {
        const [orgsResponse, ousResponse] = await Promise.all([
          getOrganizations(),
          getOperatingUnits()
        ]);

        // Filter organizations based on user access
        const accessibleOrgs = orgsResponse.organizations.filter(org => 
          canAccessOrganization(org.id)
        );
        
        setOrganizations(accessibleOrgs);
        setOperatingUnits(ousResponse.operatingUnits);
      } catch (error) {
        console.error('Error loading organizations and operating units:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [canAccessOrganization]);

  // Filter operating units based on selected organization
  const filteredOperatingUnits = selectedOrganizationId
    ? operatingUnits.filter(ou => ou.organizationId === selectedOrganizationId)
    : operatingUnits;

  // Reset operating unit selection when organization changes
  useEffect(() => {
    if (selectedOrganizationId && selectedOperatingUnitId) {
      const ou = operatingUnits.find(ou => ou.id === selectedOperatingUnitId);
      if (ou && ou.organizationId !== selectedOrganizationId) {
        onOperatingUnitChange(undefined);
      }
    }
  }, [selectedOrganizationId, selectedOperatingUnitId, operatingUnits, onOperatingUnitChange]);

  // Auto-select organization for non-global admins
  useEffect(() => {
    if (!isLoading && user && !selectedOrganizationId) {
      if (!isOrganizationAdmin()) {
        // Non-org admins can only see their own organization
        onOrganizationChange(user.organization.id);
      }
    }
  }, [isLoading, user, selectedOrganizationId, isOrganizationAdmin, onOrganizationChange]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div>
          <Label>Organization</Label>
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
        {showOperatingUnits && (
          <div>
            <Label>Operating Unit</Label>
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Organization Selector */}
      <div>
        <Label htmlFor="organization">Organization</Label>
        <Select
          value={selectedOrganizationId || ''}
          onValueChange={(value) => onOrganizationChange(value || undefined)}
        >
          <SelectTrigger id="organization">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center gap-2">
                  <span>{org.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({org.slug})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operating Unit Selector */}
      {showOperatingUnits && (
        <div>
          <Label htmlFor="operating-unit">Operating Unit</Label>
          <Select
            value={selectedOperatingUnitId || ''}
            onValueChange={(value) => onOperatingUnitChange(value || undefined)}
            disabled={!selectedOrganizationId}
          >
            <SelectTrigger id="operating-unit">
              <SelectValue placeholder="Select operating unit" />
            </SelectTrigger>
            <SelectContent>
              {filteredOperatingUnits.map((ou) => (
                <SelectItem key={ou.id} value={ou.id}>
                  <div className="flex flex-col">
                    <span>{ou.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ou.organization}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// Hook for using organization selector state
export function useOrganizationSelector(initialOrgId?: string, initialOuId?: string) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(initialOrgId);
  const [selectedOperatingUnitId, setSelectedOperatingUnitId] = useState<string | undefined>(initialOuId);

  const handleOrganizationChange = (orgId: string | undefined) => {
    setSelectedOrganizationId(orgId);
    // Reset operating unit when organization changes
    setSelectedOperatingUnitId(undefined);
  };

  const handleOperatingUnitChange = (ouId: string | undefined) => {
    setSelectedOperatingUnitId(ouId);
  };

  const reset = () => {
    setSelectedOrganizationId(undefined);
    setSelectedOperatingUnitId(undefined);
  };

  return {
    selectedOrganizationId,
    selectedOperatingUnitId,
    handleOrganizationChange,
    handleOperatingUnitChange,
    reset
  };
}
