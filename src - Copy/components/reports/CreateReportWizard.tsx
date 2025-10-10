import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WCAGLevel, WCAGVersion, ScopeType } from '@/types';
import { DEMO_LINKS } from '@/data/demo-links';

interface CreateReportWizardProps {
  onComplete: (reportId: string) => void;
  onCancel: () => void;
}

interface ReportFormData {
  title: string;
  client: string;
  project: string;
  domain: string;
  urls: string[];
  dueDate: string;
  wcagVersion: WCAGVersion;
  wcagLevel: WCAGLevel;
  scopeType: ScopeType;
  showCrosswalk: boolean;
  description: string;
  tags: string;
}

const STEPS = [
  { id: 1, name: 'Basic Information', description: 'Report details and scope' },
  { id: 2, name: 'Standards & Level', description: 'WCAG version and conformance level' },
  { id: 3, name: 'Review & Create', description: 'Confirm settings and create report' },
];

export const CreateReportWizard = ({ onComplete, onCancel }: CreateReportWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    client: '',
    project: '',
    domain: '',
    urls: [],
    dueDate: '',
    wcagVersion: '2.2',
    wcagLevel: 'AA',
    scopeType: 'web',
    showCrosswalk: false,
    description: '',
    tags: '',
  });
  const [draftId, setDraftId] = useState<string | null>(null);
  const isFirstSave = useRef(true);

  // Demo: domain and URL selection
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  // Create draft report on mount
  useEffect(() => {
    const createDraft = async () => {
      const draft = {
        ...formData,
        standards: [formData.wcagVersion],
        level: formData.wcagLevel,
        status: 'Draft',
        version: 1,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
      };
      const response = await fetch('http://localhost:3001/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (response.ok) {
        const created = await response.json();
        setDraftId(created.id);
      }
    };
    createDraft();
    // eslint-disable-next-line
  }, []);

  // Autosave on formData change (after draftId is set)
  useEffect(() => {
    if (!draftId) return;
    // Don't autosave on first mount (handled by createDraft)
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    const saveDraft = async () => {
      const patch = {
        ...formData,
        standards: [formData.wcagVersion],
        level: formData.wcagLevel,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
      };
      await fetch(`http://localhost:3001/reports/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    };
    saveDraft();
    // eslint-disable-next-line
  }, [formData, draftId]);

  const updateFormData = (updates: Partial<ReportFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    setSelectedUrls([]);
    updateFormData({ domain, urls: [] });
  };

  const handleUrlToggle = (url: string) => {
    let newUrls: string[];
    if (selectedUrls.includes(url)) {
      newUrls = selectedUrls.filter(u => u !== url);
    } else {
      newUrls = [...selectedUrls, url];
    }
    setSelectedUrls(newUrls);
    updateFormData({ urls: newUrls });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!draftId) return;
    // Validate required fields before submitting
    if (!formData.title || !formData.client || !formData.domain || !formData.urls.length || !formData.dueDate) {
      alert('Please fill in all required fields, select at least one URL, and set a due date.');
      return;
    }
    if (!formData.wcagVersion || !formData.wcagLevel || !formData.scopeType) {
      alert('Please select WCAG version, level, and scope type.');
      return;
    }
    // Finalize the report (could set status to "Draft" or "In Review")
    const finalReport = {
      ...formData,
      standards: [formData.wcagVersion],
      level: formData.wcagLevel,
      status: 'Draft',
      tags: formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    };
    try {
      const response = await fetch(`http://localhost:3001/reports/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalReport),
      });
      if (!response.ok) {
        throw new Error('Failed to finalize report');
      }
      onComplete(draftId);
    } catch (error) {
      alert('Error creating report: ' + error.message);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.client && formData.domain && formData.urls.length > 0;
      case 2:
        return formData.wcagVersion && formData.wcagLevel && formData.scopeType;
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Get URLs for selected domain
  const domainObj = DEMO_LINKS.find(d => d.domain === selectedDomain);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Accessibility Report
        </h1>
        <p className="text-muted-foreground">
          Set up a new WCAG compliance audit report
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Report creation progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => (
              <li key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium
                      ${currentStep >= step.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground text-muted-foreground'
                      }
                    `}
                    aria-current={currentStep === step.id ? 'step' : undefined}
                  >
                    {step.id}
                  </div>
                  <div className="ml-3 text-sm">
                    <div className={`font-medium ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {stepIdx < STEPS.length - 1 && (
                  <div className="flex-1 mx-8">
                    <div className={`h-0.5 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="e.g., E-commerce Platform Audit"
                    required
                    minLength={5}
                  />
                  <div className="text-xs text-muted-foreground">
                    Enter a descriptive title for the audit (at least 5 characters).
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client}
                    onValueChange={(value) => updateFormData({ client: value })}
                  >
                    <SelectTrigger id="client" className="w-full">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIH">NIH (National Institutes of Health)</SelectItem>
                      <SelectItem value="NPS">NPS (National Park Service)</SelectItem>
                      <SelectItem value="GSA">GSA (General Services Administration)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    Choose the organization for this audit.
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateFormData({ dueDate: e.target.value })}
                    required
                  />
                  <div className="text-xs text-muted-foreground">
                    Set a target completion date for this report.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project Name</Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) => updateFormData({ project: e.target.value })}
                    placeholder="e.g., Main Shopping Site"
                  />
                  <div className="text-xs text-muted-foreground">
                    (Optional) Enter a project or subsite name.
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain *</Label>
                  <Select
                    value={selectedDomain}
                    onValueChange={handleDomainChange}
                  >
                    <SelectTrigger id="domain" className="w-full">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_LINKS.map(domain => (
                        <SelectItem key={domain.domain} value={domain.domain}>
                          {domain.name} ({domain.domain})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    Select the main domain for this audit.
                  </div>
                </div>
              </div>

              {selectedDomain && domainObj && (
                <div className="space-y-2">
                  <Label>URLs to Audit *</Label>
                  <div className="flex flex-col gap-2">
                    {domainObj.links.map(url => (
                      <label key={url} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedUrls.includes(url)}
                          onChange={() => handleUrlToggle(url)}
                        />
                        <span className="truncate">{url}</span>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Select one or more URLs from the domain to include in this audit.
                  </div>
                  {selectedUrls.length === 0 && (
                    <div className="text-xs text-destructive">Select at least one URL.</div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Brief description of the audit scope and objectives"
                  rows={3}
                />
                <div className="text-xs text-muted-foreground">
                  (Optional) Add any notes about the scope, goals, or special requirements.
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags/Labels</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => updateFormData({ tags: e.target.value })}
                  placeholder="e.g., homepage, ARIA, PDF, urgent"
                />
                <div className="text-xs text-muted-foreground">
                  (Optional) Add comma-separated tags for easier filtering and organization.
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">WCAG Standards & Scope</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">WCAG Version</Label>
                    <RadioGroup
                      value={formData.wcagVersion}
                      onValueChange={(value) => updateFormData({ wcagVersion: value as WCAGVersion })}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2.1" id="wcag-2.1" />
                        <Label htmlFor="wcag-2.1">WCAG 2.1</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>WCAG 2.1 is widely adopted and required by many policies.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2.2" id="wcag-2.2" />
                        <Label htmlFor="wcag-2.2">WCAG 2.2 (Recommended)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>WCAG 2.2 is the latest version and includes new success criteria.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Conformance Level</Label>
                    <RadioGroup
                      value={formData.wcagLevel}
                      onValueChange={(value) => updateFormData({ wcagLevel: value as WCAGLevel })}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="A" id="level-a" />
                        <Label htmlFor="level-a">Level A (Minimum)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Level A is the minimum conformance level for accessibility.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="AA" id="level-aa" />
                        <Label htmlFor="level-aa">Level AA (Standard)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Level AA is the most commonly required level for legal compliance.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="AAA" id="level-aaa" />
                        <Label htmlFor="level-aaa">Level AAA (Enhanced)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Level AAA is the highest level and is rarely fully achieved.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Scope Type</Label>
                    <RadioGroup
                      value={formData.scopeType}
                      onValueChange={(value) => updateFormData({ scopeType: value as ScopeType })}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="web" id="scope-web" />
                        <Label htmlFor="scope-web">Web Content</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>For websites, web apps, and online services.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mobile" id="scope-mobile" />
                        <Label htmlFor="scope-mobile">Mobile Application</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>For native or hybrid mobile apps.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="scope-pdf" />
                        <Label htmlFor="scope-pdf">PDF Document</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>For standalone PDF or document accessibility audits.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg mt-4">
                  <Checkbox
                    id="crosswalk"
                    checked={formData.showCrosswalk}
                    onCheckedChange={(checked) => updateFormData({ showCrosswalk: !!checked })}
                  />
                  <Label htmlFor="crosswalk" className="flex items-center gap-2">
                    Show Section 508 and ADA crosswalk references
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Displays mapping to Section 508 and ADA Title II requirements for reference.
                            Pass/fail counts are still based on WCAG criteria.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review Report Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Report Title</Label>
                    <p className="text-muted-foreground">{formData.title}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Client</Label>
                    <p className="text-muted-foreground">{formData.client}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Domain</Label>
                    <p className="text-muted-foreground">{formData.domain}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Due Date</Label>
                    <p className="text-muted-foreground">{formData.dueDate}</p>
                  </div>
                  <div>
                    <Label className="font-medium">URLs</Label>
                    <ul className="text-muted-foreground text-xs">
                      {formData.urls.map(url => (
                        <li key={url}>{url}</li>
                      ))}
                    </ul>
                  </div>
                  {formData.tags && (
                    <div>
                      <Label className="font-medium">Tags</Label>
                      <ul className="text-muted-foreground text-xs">
                        {formData.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium">Standards</Label>
                    <p className="text-muted-foreground">
                      WCAG {formData.wcagVersion} Level {formData.wcagLevel}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Scope</Label>
                    <p className="text-muted-foreground capitalize">{formData.scopeType}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Crosswalk</Label>
                    <p className="text-muted-foreground">
                      {formData.showCrosswalk ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>

              {formData.description && (
                <div>
                  <Label className="font-medium">Description</Label>
                  <p className="text-muted-foreground mt-1">{formData.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>
        
        <Button
          onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
          disabled={!isStepValid(currentStep)}
        >
          {currentStep === STEPS.length ? 'Create Report' : 'Next'}
          {currentStep < STEPS.length && (
            <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};
