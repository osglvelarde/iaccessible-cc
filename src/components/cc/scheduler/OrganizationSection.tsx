"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { ScheduleConfig, OperatingUnit } from "@/lib/scheduler-api";

interface OrganizationSectionProps {
  formData: Partial<ScheduleConfig>;
  operatingUnits: OperatingUnit[];
  onUpdate: (updates: Partial<ScheduleConfig>) => void;
}

export default function OrganizationSection({ 
  formData, 
  operatingUnits, 
  onUpdate 
}: OrganizationSectionProps) {
  const handleOrganizationChange = (value: string) => {
    onUpdate({ 
      organization: value,
      operatingUnit: '' // Reset operating unit when organization changes
    });
  };

  const handleOperatingUnitChange = (value: string) => {
    onUpdate({ operatingUnit: value });
  };

  return (
    <div className="space-y-6">
      {/* Organization Selection */}
      <div className="space-y-2">
        <Label htmlFor="organization" className="text-sm font-medium">
          Organization
        </Label>
        <Select
          value={formData.organization || ''}
          onValueChange={handleOrganizationChange}
        >
          <SelectTrigger id="organization" className="w-full">
            <SelectValue placeholder="Select your organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Department of Commerce">
              Department of Commerce
            </SelectItem>
            <SelectItem value="Department of Education">
              Department of Education
            </SelectItem>
            <SelectItem value="Department of Health and Human Services">
              Department of Health and Human Services
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the organization that owns the content to be scanned
        </p>
      </div>

      {/* Operating Unit Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="operatingUnit" className="text-sm font-medium">
            Operating Unit
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Select the operating unit where you have an active role in accessibility testing, 
                  remediation, or oversight. Each selected unit may have its own applications, URLs, 
                  and points of contact that will be included in the onboarding and assessment process.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Select
          value={formData.operatingUnit || ''}
          onValueChange={handleOperatingUnitChange}
          disabled={!formData.organization}
        >
          <SelectTrigger id="operatingUnit" className="w-full">
            <SelectValue placeholder="Select your operating unit" />
          </SelectTrigger>
          <SelectContent>
            {operatingUnits.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{unit.name}</span>
                  {unit.description && (
                    <span className="text-xs text-muted-foreground">
                      {unit.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {!formData.organization && (
          <p className="text-xs text-muted-foreground">
            Please select an organization first
          </p>
        )}
        
        {formData.organization && operatingUnits.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Loading operating units...
          </p>
        )}
        
        {formData.organization && operatingUnits.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Select the operating unit that will own this scan schedule
          </p>
        )}
      </div>
    </div>
  );
}
