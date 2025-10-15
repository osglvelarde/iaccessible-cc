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
import { OperatingUnit } from '@/lib/types/users-roles';

interface OperatingUnitManagementProps {
  operatingUnits: OperatingUnit[];
  onOperatingUnitsChange: (units: OperatingUnit[]) => void;
  canManage: boolean;
}

export default function OperatingUnitManagement({ 
  operatingUnits, 
  onOperatingUnitsChange, 
  canManage 
}: OperatingUnitManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter operating units based on search
  const filteredUnits = operatingUnits.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateUnit = () => {
    // TODO: Implement create operating unit dialog
    console.log('Create new operating unit');
  };

  const handleEditUnit = (unit: OperatingUnit) => {
    // TODO: Implement edit operating unit dialog
    console.log('Edit operating unit:', unit.id);
  };

  const handleDeleteUnit = (unit: OperatingUnit) => {
    // TODO: Implement delete operating unit confirmation
    console.log('Delete operating unit:', unit.id);
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search operating units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h4 className="font-medium text-lg">{unit.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {unit.organization}
                    </p>
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
            {filteredUnits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No operating units found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
