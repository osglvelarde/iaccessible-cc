"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, FileText, Search, Globe, Eye, BarChart3, Users } from "lucide-react";
import { ScheduleConfig, ScanType } from "@/lib/scheduler-api";

interface ScanTypeSectionProps {
  formData: Partial<ScheduleConfig>;
  onUpdate: (updates: Partial<ScheduleConfig>) => void;
}

const scanTypeConfig: Array<{
  id: ScanType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'webpage-accessibility',
    label: 'Webpage Accessibility Scan',
    description: 'Automated accessibility testing using WCAG 2.1/2.2 standards and Section 508 compliance',
    icon: Globe,
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'pdf-accessibility',
    label: 'PDF Accessibility Scan',
    description: 'PDF/UA compliance testing for document accessibility standards',
    icon: FileText,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    id: 'sitemap-crawl',
    label: 'Sitemap Crawl',
    description: 'Comprehensive site crawling to discover and test all accessible pages',
    icon: Search,
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    id: 'readability',
    label: 'Readability Scan',
    description: 'Content readability analysis and plain language compliance checking',
    icon: Eye,
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  {
    id: 'seo',
    label: 'SEO Scan',
    description: 'Search engine optimization analysis and meta tag validation',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    id: 'manual-testing',
    label: 'Manual Testing',
    description: 'Pages will be queued for Manual Testing workflow with human evaluators',
    icon: Users,
    color: 'bg-pink-100 text-pink-800 border-pink-300'
  }
];

export default function ScanTypeSection({ formData, onUpdate }: ScanTypeSectionProps) {
  const selectedScanTypes = formData.scanTypes || [];

  const handleScanTypeChange = (scanType: ScanType, checked: boolean) => {
    const currentTypes = selectedScanTypes;
    let newTypes: ScanType[];

    if (checked) {
      newTypes = [...currentTypes, scanType];
    } else {
      newTypes = currentTypes.filter(type => type !== scanType);
    }

    onUpdate({ scanTypes: newTypes });
  };

  const isSelected = (scanType: ScanType) => selectedScanTypes.includes(scanType);

  return (
    <div className="space-y-6">
      {/* Selection Count Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Selected Scan Types</Label>
          <Badge variant="outline" className="text-sm">
            {selectedScanTypes.length} selected
          </Badge>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Select all accessibility tools you personally use for testing, monitoring, 
                remediation, design, management, or oversight activities. You can choose 
                multiple scan types for comprehensive coverage.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Scan Type Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scanTypeConfig.map((config) => {
          const Icon = config.icon;
          const isChecked = isSelected(config.id);
          
          return (
            <div
              key={config.id}
              className={`relative rounded-lg border p-4 transition-all duration-200 ${
                isChecked 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={config.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => 
                    handleScanTypeChange(config.id, checked as boolean)
                  }
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Label 
                      htmlFor={config.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {config.label}
                    </Label>
                    {isChecked && (
                      <Badge className={`text-xs ${config.color}`}>
                        Selected
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Testing Note */}
      {isSelected('manual-testing') && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start">
            <Users className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Manual Testing Workflow
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                Pages selected for manual testing will be queued for human evaluators 
                who will conduct comprehensive accessibility assessments using assistive 
                technologies and manual testing procedures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Message */}
      {selectedScanTypes.length === 0 && (
        <p className="text-sm text-destructive">
          Please select at least one scan type to continue
        </p>
      )}
    </div>
  );
}
