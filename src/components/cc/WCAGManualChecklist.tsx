'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info, Plus, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TestSession, TestStatus, getCriterionResult, getStatusBadgeVariant } from '@/lib/manual-testing';
import { WCAG_PRINCIPLES, WCAGCriterion, groupCriteriaByPrinciple } from '@/lib/wcag-complete';
import EvidenceUploadDialog from './EvidenceUploadDialog';
import TestNoteDialog from './TestNoteDialog';

interface WCAGManualChecklistProps {
  session: TestSession;
  criteria: WCAGCriterion[];
  onStatusChange: (wcagId: string, status: TestStatus) => void;
  onEvidenceUpload: (wcagId: string, evidence: { file: File; description: string }) => void;
  onNoteUpdate: (wcagId: string, note: string) => void;
  gridLayout?: boolean;
}

export default function WCAGManualChecklist({
  session,
  criteria,
  onStatusChange,
  onEvidenceUpload,
  onNoteUpdate,
  gridLayout = false
}: WCAGManualChecklistProps) {
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<string>>(
    new Set(['1']) // Expand first principle (Perceivable) by default
  );
  const [uploadModalOpen, setUploadModalOpen] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState<string | null>(null);

  const groupedCriteria = groupCriteriaByPrinciple(criteria);

  const togglePrinciple = (principleId: string) => {
    const newExpanded = new Set(expandedPrinciples);
    if (newExpanded.has(principleId)) {
      newExpanded.delete(principleId);
    } else {
      newExpanded.add(principleId);
    }
    setExpandedPrinciples(newExpanded);
  };

  const getLevelBadgeColor = (level: 'A' | 'AA' | 'AAA') => {
    switch (level) {
      case 'A':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-700 hover:text-blue-100 hover:border-blue-600';
      case 'AA':
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-700 hover:text-amber-100 hover:border-amber-600';
      case 'AAA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-700 hover:text-emerald-100 hover:border-emerald-600';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const handleEvidenceUploadComplete = (files: { file: File; type: string }[]) => {
    if (uploadModalOpen) {
      files.forEach(fileData => {
        const evidence = {
          file: fileData.file,
          description: `Uploaded evidence for ${fileData.file.name}`
        };
        onEvidenceUpload(uploadModalOpen, evidence);
      });
    }
    setUploadModalOpen(null);
  };

  const handleNoteSave = (note: string) => {
    if (noteModalOpen) {
      onNoteUpdate(noteModalOpen, note);
    }
    setNoteModalOpen(null);
  };

  // Render individual criterion card
  const renderCriterionCard = (criterion: WCAGCriterion, index: number) => {
    const result = getCriterionResult(session, criterion.wcagId);
    const currentStatus = result?.status || 'N/A';

    return (
      <Card key={`${criterion.wcagId}-${criterion.wcagVersion}-${index}`} className="border rounded-lg h-fit">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {criterion.wcagId}
                </span>
                <Badge className={getLevelBadgeColor(criterion.level)}>
                  {criterion.level}
                </Badge>
              </div>
              <h4 className="font-medium text-foreground mb-1">
                {criterion.title}
              </h4>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-3 w-3" />
                    <span className="sr-only">
                      More information about {criterion.title}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="left" 
                  className="max-w-md bg-background dark:bg-gray-800 border border-border shadow-lg"
                >
                  <div className="space-y-3">
                    <p className="font-medium text-foreground dark:text-gray-100">{criterion.title}</p>
                    <p className="text-sm leading-relaxed text-foreground dark:text-gray-100">{criterion.howToTest}</p>
                    <div className="text-xs text-muted-foreground bg-muted dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      WCAG {criterion.wcagId} • Level {criterion.level}
                    </div>
                    <div className="pt-2 border-t border-border dark:border-gray-600">
                      <a 
                        href={criterion.understandingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary dark:text-blue-400 hover:text-primary/80 dark:hover:text-blue-300 hover:underline underline-offset-2 transition-colors"
                      >
                        View Understanding WCAG →
                      </a>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <RadioGroup
            value={currentStatus}
            onValueChange={(value) => onStatusChange(criterion.wcagId, value as TestStatus)}
            className="flex flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Pass" id={`${criterion.wcagId}-${criterion.wcagVersion}-pass`} />
              <Label
                htmlFor={`${criterion.wcagId}-${criterion.wcagVersion}-pass`}
                className="text-sm text-green-600 cursor-pointer"
              >
                Pass
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Fail" id={`${criterion.wcagId}-${criterion.wcagVersion}-fail`} />
              <Label
                htmlFor={`${criterion.wcagId}-${criterion.wcagVersion}-fail`}
                className="text-sm text-red-600 cursor-pointer"
              >
                Fail
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="N/A" id={`${criterion.wcagId}-${criterion.wcagVersion}-na`} />
              <Label
                htmlFor={`${criterion.wcagId}-${criterion.wcagVersion}-na`}
                className="text-sm text-gray-500 cursor-pointer"
              >
                N/A
              </Label>
            </div>
          </RadioGroup>

          {currentStatus === 'Fail' && (
            <div className="flex flex-col gap-2 pt-2 border-t">
              <EvidenceUploadDialog
                wcagId={criterion.wcagId}
                criterionTitle={criterion.title}
                testId={session.testId}
                isOpen={uploadModalOpen === criterion.wcagId}
                onClose={() => setUploadModalOpen(null)}
                onUploadComplete={handleEvidenceUploadComplete}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-full"
                onClick={() => setUploadModalOpen(criterion.wcagId)}
              >
                <Upload className="h-3 w-3 mr-1" aria-hidden="true" />
                Evidence
                {result?.evidence && result.evidence.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {result.evidence.length}
                  </Badge>
                )}
              </Button>
              
              <TestNoteDialog
                wcagId={criterion.wcagId}
                criterionTitle={criterion.title}
                isOpen={noteModalOpen === criterion.wcagId}
                initialNote={result?.note || ''}
                onClose={() => setNoteModalOpen(null)}
                onSave={handleNoteSave}
              />
              <Button
                size="sm"
                variant={result?.note ? "default" : "outline"}
                className="h-7 w-full"
                onClick={() => setNoteModalOpen(criterion.wcagId)}
              >
                <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
                Note
                {result?.note && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    Added
                  </Badge>
                )}
              </Button>
            </div>
          )}

          {/* Show note preview if exists */}
          {result?.note && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">Note:</div>
              <div className="text-sm bg-muted/50 p-2 rounded text-foreground">
                {result.note.length > 100 
                  ? `${result.note.substring(0, 100)}...` 
                  : result.note
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (gridLayout) {
    return (
      <div className="space-y-4">
        {WCAG_PRINCIPLES.map((principle) => {
          const principleCriteria = groupedCriteria[principle.name] || [];
          if (principleCriteria.length === 0) return null;

          return (
            <Collapsible
              key={principle.id}
              open={expandedPrinciples.has(principle.id)}
              onOpenChange={() => togglePrinciple(principle.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto text-left hover:bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {expandedPrinciples.has(principle.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-foreground">
                        {principle.id}. {principle.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {principleCriteria.length} criteria • Click to {expandedPrinciples.has(principle.id) ? 'collapse' : 'expand'}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {principleCriteria.length}
                    </Badge>
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {principleCriteria.map((criterion, index) => renderCriterionCard(criterion, index))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // Original list layout
  return (
    <div className="space-y-2 p-4">
      {WCAG_PRINCIPLES.map((principle) => {
        const principleCriteria = groupedCriteria[principle.name] || [];
        if (principleCriteria.length === 0) return null;

        return (
          <Collapsible
            key={principle.id}
            open={expandedPrinciples.has(principle.id)}
            onOpenChange={() => togglePrinciple(principle.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 flex-1">
                  {expandedPrinciples.has(principle.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">
                      {principle.id}. {principle.name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {principleCriteria.length} criteria
                    </div>
                  </div>
                </div>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pl-6 space-y-2">
              {principleCriteria.map((criterion, index) => renderCriterionCard(criterion, index))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
