"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Building2, 
  Globe, 
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import { OperatingUnit, Organization } from '@/lib/types/users-roles';
import OperatingUnitFormDialog from './OperatingUnitFormDialog';
import { deleteOperatingUnit } from '@/lib/users-roles-api';

interface OperatingUnitManagementProps {
  operatingUnits: OperatingUnit[];
  organizations: Organization[];
  onOperatingUnitsChange: (units: OperatingUnit[]) => void;
  canManage: boolean;
}

export default function OperatingUnitManagement({ 
  operatingUnits, 
  organizations,
  onOperatingUnitsChange, 
  canManage 
}: OperatingUnitManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OperatingUnit | null>(null);

  // Filter operating units based on search and organization
  const filteredUnits = operatingUnits.filter(unit => {
    const matchesSearch = 
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesOrganization = organizationFilter === 'all' || unit.organizationId === organizationFilter;
    
    return matchesSearch && matchesOrganization;
  });

  // Group operating units by organization
  const groupedUnits = filteredUnits.reduce((acc, unit) => {
    const orgId = unit.organizationId;
    if (!acc[orgId]) {
      acc[orgId] = [];
    }
    acc[orgId].push(unit);
    return acc;
  }, {} as Record<string, OperatingUnit[]>);

  // Get organization name for display
  const getOrganizationName = (orgId: string) => {
    const org = organizations?.find(o => o.id === orgId);
    return org ? org.name : 'Unknown Organization';
  };

  const handleCreateUnit = () => {
    setSelectedUnit(null);
    setDialogOpen(true);
  };

  const handleEditUnit = (unit: OperatingUnit) => {
    setSelectedUnit(unit);
    setDialogOpen(true);
  };

  const handleDeleteUnit = async (unit: OperatingUnit) => {
    if (window.confirm(`Are you sure you want to delete "${unit.name}"? This action cannot be undone.`)) {
      try {
        await deleteOperatingUnit(unit.id);
        const updatedUnits = operatingUnits.filter(u => u.id !== unit.id);
        onOperatingUnitsChange(updatedUnits);
      } catch (error) {
        console.error('Failed to delete operating unit:', error);
        alert('Failed to delete operating unit. Please try again.');
      }
    }
  };

  const handleDialogSuccess = (unit: OperatingUnit) => {
    if (selectedUnit) {
      // Update existing unit
      const updatedUnits = operatingUnits.map(u => u.id === unit.id ? unit : u);
      onOperatingUnitsChange(updatedUnits);
    } else {
      // Add new unit
      onOperatingUnitsChange([...operatingUnits, unit]);
    }
    setDialogOpen(false);
    setSelectedUnit(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Operating Units ({filteredUnits.length})</CardTitle>
          {canManage && (
            <Button onClick={handleCreateUnit} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Operating Unit
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search operating units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={organizationFilter}
            onChange={(e) => setOrganizationFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Organizations</option>
            {organizations?.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            )) || []}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-6">
            {Object.entries(groupedUnits).map(([orgId, units]) => (
              <div key={orgId} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{getOrganizationName(orgId)}</h3>
                  <Badge variant="outline">{units.length} unit{units.length !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="space-y-3 ml-4">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium">{unit.name}</h4>
                          </div>
                          {unit.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {unit.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {unit.domains.length} domain{unit.domains.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {/* TODO: Get actual user count */}
                                0 users
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {unit.domains.map((domain) => (
                              <Badge key={domain} variant="outline" className="text-xs">
                                {domain}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUnit(unit)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedUnits).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No operating units found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <OperatingUnitFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operatingUnit={selectedUnit}
        organizations={organizations}
        onSuccess={handleDialogSuccess}
      />
    </Card>
  );
}
