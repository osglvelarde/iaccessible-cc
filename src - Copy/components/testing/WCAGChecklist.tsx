import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Info, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WCAG_CRITERIA, WCAG_PRINCIPLES } from '@/data/wcag-criteria';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { NoteModal } from './NoteModal';
import type { WCAGVersion, WCAGLevel, FindingStatus, EvidenceType } from '@/types';

interface WCAGChecklistProps {
  wcagVersion: WCAGVersion;
  wcagLevel: WCAGLevel;
  showCrosswalk: boolean;
  pageId: string;
  reportId: string;
}

interface CriterionState {
  status: FindingStatus;
  hasEvidence: boolean;
  hasNotes: boolean;
}

export const WCAGChecklist = ({
  wcagVersion,
  wcagLevel,
  showCrosswalk,
  pageId,
  reportId,
}: WCAGChecklistProps) => {
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<string>>(
    new Set(['1']) // Expand first principle by default
  );
  const [criterionStates, setCriterionStates] = useState<Record<string, CriterionState>>({});
  const [uploadModalOpen, setUploadModalOpen] = useState<string | null>(null);
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({});
  const [noteModalOpen, setNoteModalOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Fetch findings and map to criterionStates on mount or when reportId/pageId changes
  useEffect(() => {
    const fetchFindings = async () => {
      if (!reportId) return;
      try {
        const res = await fetch(`http://localhost:3001/findings?reportId=${reportId}&pageId=`);
        if (!res.ok) return;
        const findings = await res.json();
        const newStates: Record<string, CriterionState> = {};
        const newNotes: Record<string, string> = {};
        const newEvidenceCounts: Record<string, number> = {};
        findings.forEach((finding: any) => {
          newStates[finding.wcagId] = {
            status: finding.status,
            hasEvidence: Array.isArray(finding.evidenceIds) && finding.evidenceIds.length > 0,
            hasNotes: !!finding.description,
          };
          if (finding.description) newNotes[finding.wcagId] = finding.description;
          if (Array.isArray(finding.evidenceIds)) newEvidenceCounts[finding.wcagId] = finding.evidenceIds.length;
        });
        setCriterionStates(newStates);
        setNotes(newNotes);
        setEvidenceCounts(newEvidenceCounts);
      } catch (err) {
        // Ignore errors
      }
    };
    fetchFindings();
  }, [reportId, pageId]);

  const handleUploadComplete = async (files: { file: File; type: EvidenceType }[]) => {
    if (uploadModalOpen) {
      setEvidenceCounts(prev => ({
        ...prev,
        [uploadModalOpen]: (prev[uploadModalOpen] || 0) + files.length,
      }));
      try {
        const res = await fetch(`http://localhost:3001/findings?reportId=${reportId}&pageId=&wcagId=${uploadModalOpen}`);
        const existing = await res.json();
        const evidenceIds = files.map(f => f.file.name);
        const evidenceTypes = files.map(f => f.type);
        if (existing.length > 0) {
          await fetch(`http://localhost:3001/findings/${existing[0].id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evidenceIds, evidenceTypes }),
          });
        } else {
          await fetch('http://localhost:3001/findings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportId,
              pageId,
              wcagId: uploadModalOpen,
              status: 'Fail',
              description: notes[uploadModalOpen] || '',
              evidenceIds,
              evidenceTypes,
              labels: [],
              assistiveTechUsed: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: 'autosave',
              updatedBy: 'autosave'
            }),
          });
        }
      } catch (err) {
        console.error('Autosave evidence failed:', err);
      }
    }
    console.log('Uploaded files:', files);
  };

  // Filter criteria based on selected version and level
  const filteredCriteria = WCAG_CRITERIA.filter(criterion => {
    const levelOrder = { 'A': 1, 'AA': 2, 'AAA': 3 };
    return levelOrder[criterion.level] <= levelOrder[wcagLevel];
  });

  const groupedCriteria = WCAG_PRINCIPLES.map(principle => ({
    ...principle,
    criteria: filteredCriteria.filter(c => c.principle === principle.name),
  }));

  const togglePrinciple = (principleId: string) => {
    const newExpanded = new Set(expandedPrinciples);
    if (newExpanded.has(principleId)) {
      newExpanded.delete(principleId);
    } else {
      newExpanded.add(principleId);
    }
    setExpandedPrinciples(newExpanded);
  };

  const updateCriterionStatus = async (wcagId: string, status: FindingStatus) => {
    setCriterionStates(prev => ({
      ...prev,
      [wcagId]: {
        ...prev[wcagId],
        status,
      },
    }));
    try {
      const res = await fetch(`http://localhost:3001/findings?reportId=${reportId}&pageId=&wcagId=${wcagId}`);
      const existing = await res.json();
      if (existing.length > 0) {
        await fetch(`http://localhost:3001/findings/${existing[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } else {
        await fetch('http://localhost:3001/findings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId,
            pageId: "",
            wcagId,
            status,
            description: notes[wcagId] || '',
            evidenceIds: [],
            labels: [],
            assistiveTechUsed: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'autosave',
            updatedBy: 'autosave'
          }),
        });
      }
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  const getStatusColor = (status: FindingStatus) => {
    switch (status) {
      case 'Pass':
        return 'text-success';
      case 'Fail':
        return 'text-destructive';
      case 'Needs Review':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getLevelBadgeColor = (level: WCAGLevel) => {
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

  return (
    <div className="space-y-2 p-4">
      {groupedCriteria.map((principle) => (
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
                    {principle.criteria.length} criteria
                  </div>
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pl-6 space-y-2">
            {principle.criteria.map((criterion) => {
              const state = criterionStates[criterion.wcagId] || { status: 'Needs Review' as FindingStatus };

              return (
                <div
                  key={criterion.wcagId}
                  className="border rounded-lg p-3 space-y-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {criterion.wcagId}
                        </span>
                        <Badge className={getLevelBadgeColor(criterion.level)}>
                          {criterion.level}
                        </Badge>
                        {showCrosswalk && (
                          <Badge variant="outline" className="text-xs">
                            508
                          </Badge>
                        )}
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
                        <TooltipContent side="left" className="max-w-md">
                          <div className="space-y-2">
                            <p className="font-medium">{criterion.title}</p>
                            <p className="text-sm">{criterion.howToTest}</p>
                            <div className="text-xs text-muted-foreground">
                              WCAG {criterion.wcagId} • Level {criterion.level}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <RadioGroup
                    value={state.status}
                    onValueChange={(value) => updateCriterionStatus(criterion.wcagId, value as FindingStatus)}
                    className="flex flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Pass" id={`${criterion.wcagId}-pass`} />
                      <Label
                        htmlFor={`${criterion.wcagId}-pass`}
                        className="text-sm text-success cursor-pointer"
                      >
                        Pass
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Fail" id={`${criterion.wcagId}-fail`} />
                      <Label
                        htmlFor={`${criterion.wcagId}-fail`}
                        className="text-sm text-destructive cursor-pointer"
                      >
                        Fail
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Needs Review" id={`${criterion.wcagId}-review`} />
                      <Label
                        htmlFor={`${criterion.wcagId}-review`}
                        className="text-sm text-warning cursor-pointer"
                      >
                        Review
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="N/A" id={`${criterion.wcagId}-na`} />
                      <Label
                        htmlFor={`${criterion.wcagId}-na`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        N/A
                      </Label>
                    </div>
                  </RadioGroup>

                  {state.status === 'Fail' && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <EvidenceUploadModal
                        wcagId={criterion.wcagId}
                        criterionTitle={criterion.title}
                        isOpen={uploadModalOpen === criterion.wcagId}
                        onClose={() => setUploadModalOpen(null)}
                        onUploadComplete={handleUploadComplete}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => setUploadModalOpen(criterion.wcagId)}
                      >
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                        Evidence
                        {evidenceCounts[criterion.wcagId] ? (
                          <span className="ml-2 inline-block bg-blue-200 text-blue-800 rounded-full px-2 py-0.5 text-xs font-semibold">
                            +{evidenceCounts[criterion.wcagId]}
                          </span>
                        ) : null}
                      </Button>
                      <NoteModal
                        wcagId={criterion.wcagId}
                        criterionTitle={criterion.title}
                        isOpen={noteModalOpen === criterion.wcagId}
                        initialNote={notes[criterion.wcagId] || ''}
                        onClose={() => setNoteModalOpen(null)}
                        onSave={async note => {
                          setNotes(prev => ({ ...prev, [criterion.wcagId]: note }));
                          // AUTOSAVE: Update finding with new note
                          try {
                            const res = await fetch(`http://localhost:3001/findings?reportId=${reportId}&pageId=&wcagId=${criterion.wcagId}`);
                            const existing = await res.json();
                            if (existing.length > 0) {
                              await fetch(`http://localhost:3001/findings/${existing[0].id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ description: note }),
                              });
                            } else {
                              await fetch('http://localhost:3001/findings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  reportId,
                                  pageId: "",
                                  wcagId: criterion.wcagId,
                                  status: criterionStates[criterion.wcagId]?.status || 'Needs Review',
                                  description: note,
                                  evidenceIds: [],
                                  labels: [],
                                  assistiveTechUsed: [],
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                  createdBy: 'autosave',
                                  updatedBy: 'autosave'
                                }),
                              });
                            }
                          } catch (err) {
                            console.error('Autosave note failed:', err);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant={notes[criterion.wcagId] ? "default" : "outline"}
                        className="h-7"
                        onClick={() => setNoteModalOpen(criterion.wcagId)}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
                        Note
                        {notes[criterion.wcagId] ? (
                          <span className="ml-2 inline-block bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 text-xs font-semibold">
                            Added
                          </span>
                        ) : null}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};
