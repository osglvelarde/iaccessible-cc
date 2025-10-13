"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { 
  HelpCircle, 
  Plus, 
  X, 
  Download, 
  Globe, 
  FileText,
  AlertCircle 
} from "lucide-react";
import { ScheduleConfig, IntakeDomain } from "@/lib/scheduler-api";

interface DomainConfigSectionProps {
  formData: Partial<ScheduleConfig>;
  intakeDomains: IntakeDomain[];
  showIntakeImport: boolean;
  onUpdate: (updates: Partial<ScheduleConfig>) => void;
  onImportFromIntake: (domain: IntakeDomain) => void;
  onToggleIntakeImport: () => void;
}

export default function DomainConfigSection({
  formData,
  intakeDomains,
  showIntakeImport,
  onUpdate,
  onImportFromIntake,
  onToggleIntakeImport
}: DomainConfigSectionProps) {
  const [newSubdomain, setNewSubdomain] = useState("");

  const domainConfig = formData.domainConfig || { primaryDomain: '', subdomains: [] };
  const selectedScanTypes = formData.scanTypes || [];
  const hasManualTesting = selectedScanTypes.includes('manual-testing');

  const handlePrimaryDomainChange = (value: string) => {
    // Strip protocol and paths
    const cleanDomain = value
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
    
    onUpdate({
      domainConfig: {
        ...domainConfig,
        primaryDomain: cleanDomain
      }
    });
  };

  const addSubdomain = () => {
    if (newSubdomain.trim()) {
      const cleanSubdomain = newSubdomain
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .toLowerCase();
      
      if (!domainConfig.subdomains.includes(cleanSubdomain)) {
        onUpdate({
          domainConfig: {
            ...domainConfig,
            subdomains: [...domainConfig.subdomains, cleanSubdomain]
          }
        });
      }
      setNewSubdomain("");
    }
  };

  const removeSubdomain = (index: number) => {
    const newSubdomains = domainConfig.subdomains.filter((_, i) => i !== index);
    onUpdate({
      domainConfig: {
        ...domainConfig,
        subdomains: newSubdomains
      }
    });
  };

  const handleManualPagesChange = (value: string) => {
    const pages = value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    onUpdate({
      domainConfig: {
        ...domainConfig,
        manualPages: pages
      }
    });
  };

  const validateDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    return domainRegex.test(domain);
  };

  const isPrimaryDomainValid = domainConfig.primaryDomain ? validateDomain(domainConfig.primaryDomain) : true;

  return (
    <div className="space-y-6">
      {/* Primary Domain */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="primaryDomain" className="text-sm font-medium">
            Primary Domain
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Main domain for this operating unit (without paths – e.g., agency.gov)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex gap-2">
          <Input
            id="primaryDomain"
            type="text"
            placeholder="agency.gov"
            value={domainConfig.primaryDomain}
            onChange={(e) => handlePrimaryDomainChange(e.target.value)}
            className={`flex-1 ${!isPrimaryDomainValid ? 'border-destructive' : ''}`}
          />
          
          {intakeDomains.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleIntakeImport}
              className="whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-1" />
              Import from Intake
            </Button>
          )}
        </div>
        
        {!isPrimaryDomainValid && domainConfig.primaryDomain && (
          <p className="text-xs text-destructive">
            Please enter a valid domain format (e.g., agency.gov)
          </p>
        )}
        
        {intakeDomains.length === 0 && formData.operatingUnit && (
          <p className="text-xs text-muted-foreground">
            No intake form data available for this operating unit
          </p>
        )}
      </div>

      {/* Intake Import Modal */}
      <AnimatePresence>
        {showIntakeImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-800">
                      Import from Intake Form
                    </h4>
                  </div>
                  
                  <p className="text-xs text-blue-700">
                    Select a domain configuration from your intake form submission:
                  </p>
                  
                  <div className="space-y-2">
                    {intakeDomains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                      >
                        <div>
                          <p className="text-sm font-medium">{domain.domain}</p>
                          {domain.subdomains.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {domain.subdomains.length} subdomain(s)
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onImportFromIntake(domain)}
                        >
                          Import
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onToggleIntakeImport}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subdomains */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Additional Subdomains</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Add any subdomains that need to be monitored by iAccessible (domain only, no paths)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Add Subdomain Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="subdomain.agency.gov"
            value={newSubdomain}
            onChange={(e) => setNewSubdomain(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSubdomain()}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubdomain}
            disabled={!newSubdomain.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Subdomain
          </Button>
        </div>

        {/* Subdomain List */}
        <AnimatePresence>
          {domainConfig.subdomains.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {domainConfig.subdomains.map((subdomain, index) => (
                <motion.div
                  key={`${subdomain}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded border"
                >
                  <span className="text-sm font-mono">{subdomain}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubdomain(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {domainConfig.subdomains.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No subdomains added yet. Click &quot;Add Subdomain&quot; to include additional domains.
          </p>
        )}
      </div>

      {/* Manual Testing Pages */}
      <AnimatePresence>
        {hasManualTesting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="manualPages" className="text-sm font-medium">
                Manual Testing Pages
              </Label>
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Manual Testing
              </Badge>
            </div>
            
            <Textarea
              id="manualPages"
              placeholder="Enter one URL per line for manual testing queue&#10;https://example.com/page1&#10;https://example.com/page2"
              value={domainConfig.manualPages?.join('\n') || ''}
              onChange={(e) => handleManualPagesChange(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">
                  Manual Testing Workflow
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  These URLs will be queued for human evaluators who will conduct 
                  comprehensive accessibility assessments using assistive technologies.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
