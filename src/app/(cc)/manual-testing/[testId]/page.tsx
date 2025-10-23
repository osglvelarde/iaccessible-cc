'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, AlertCircle, Settings, ExternalLink, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  TestSession,
  TestEvidence,
  createTestSession,
  updateCriterionResult,
  addEvidenceToCriterion,
  updateCriterionNote,
  calculateSessionSummary,
  autoSaveSession,
  saveSessionToLocalStorage,
  loadSessionFromLocalStorage,
} from '@/lib/manual-testing';
import { getCriteriaForVersionAndLevel } from '@/lib/wcag-complete';
import { parseCrawledPages, CrawledPage } from '@/lib/csv-parser';
import WCAGManualChecklist from '@/components/cc/WCAGManualChecklist';

interface ManualTestingWorkspaceProps {
  params: Promise<{
    testId: string;
  }>;
}

export default function ManualTestingWorkspace({ params }: ManualTestingWorkspaceProps) {
  const [testId, setTestId] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageUrl = searchParams.get('url') || '';

  useEffect(() => {
    async function unwrapParams() {
      const unwrapped = await params;
      setTestId(unwrapped.testId);
    }
    unwrapParams();
  }, [params]);

  const [session, setSession] = useState<TestSession | null>(null);
  const [pageData, setPageData] = useState<CrawledPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [externalTab, setExternalTab] = useState<Window | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [showTabPanel, setShowTabPanel] = useState(true);

  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load page data from CSV
      const pages = await parseCrawledPages();
      const foundPage = pages.find(p => p.webpage === pageUrl);
      setPageData(foundPage || null);

      if (testId === 'new') {
        // Create new session
        if (!pageUrl) {
          throw new Error('Page URL is required');
        }
        
        const newSession = createTestSession(
          pageUrl,
          foundPage?.operatingUnitName || foundPage?.departmentName || 'Unknown',
          foundPage?.organizationName || 'Unknown'
        );
        
        setSession(newSession);
        saveSessionToLocalStorage(newSession);
      } else {
        // Load existing session
        const existingSession = loadSessionFromLocalStorage(testId);
        if (existingSession) {
          setSession(existingSession);
        } else {
          // Try to load from API
          const response = await fetch(`/api/manual-testing/sessions?testId=${testId}`);
          if (response.ok) {
            const loadedSession = await response.json();
            setSession(loadedSession);
            saveSessionToLocalStorage(loadedSession);
          } else {
            throw new Error('Session not found');
          }
        }
      }
    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize session');
    } finally {
      setLoading(false);
    }
  }, [testId, pageUrl]);

  useEffect(() => {
    if (testId) {
      initializeSession();
    }
  }, [testId, pageUrl, initializeSession]);

  // Auto-open page in new tab when session is ready
  useEffect(() => {
    if (session && pageUrl) {
      const hasOpenedTab = sessionStorage.getItem(`tab-opened-${testId}`);
      if (!hasOpenedTab) {
        const newTab = window.open(pageUrl, '_blank');
        if (newTab) {
          sessionStorage.setItem(`tab-opened-${testId}`, 'true');
          setExternalTab(newTab);
        }
      }
    }
  }, [session, pageUrl, testId]);

  const handleCriterionStatusChange = async (wcagId: string, status: 'Pass' | 'Fail' | 'N/A' | 'Needs Senior Review') => {
    if (!session) return;

    const updatedSession = updateCriterionResult(session, wcagId, status);
    setSession(updatedSession);
    
    // Auto-save
    autoSaveSession(updatedSession, async (sessionToSave) => {
      setSaving(true);
      try {
        saveSessionToLocalStorage(sessionToSave);
        // Also save to API
        await fetch('/api/manual-testing/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionToSave)
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleEvidenceUpload = async (wcagId: string, evidence: { file: File; description: string }) => {
    if (!session) return;

    const testEvidence: TestEvidence = {
      id: crypto.randomUUID(),
      type: 'Photo', // Default type, could be determined from file type
      filename: evidence.file.name,
      uploadedAt: new Date().toISOString(),
      caption: evidence.description
    };

    const updatedSession = addEvidenceToCriterion(session, wcagId, testEvidence);
    setSession(updatedSession);
    
    // Auto-save
    autoSaveSession(updatedSession, async (sessionToSave) => {
      setSaving(true);
      try {
        saveSessionToLocalStorage(sessionToSave);
        await fetch('/api/manual-testing/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionToSave)
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleNoteUpdate = async (wcagId: string, note: string) => {
    if (!session) return;

    const updatedSession = updateCriterionNote(session, wcagId, note);
    setSession(updatedSession);
    
    // Auto-save
    autoSaveSession(updatedSession, async (sessionToSave) => {
      setSaving(true);
      try {
        saveSessionToLocalStorage(sessionToSave);
        await fetch('/api/manual-testing/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionToSave)
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleOpenExternalTab = () => {
    if (!pageUrl) return;
    
    const newTab = window.open(pageUrl, '_blank');
    if (newTab) {
      setExternalTab(newTab);
      sessionStorage.setItem(`tab-opened-${testId}`, 'true');
    }
  };

  const handleCopyUrl = async () => {
    if (!pageUrl) return;
    
    try {
      await navigator.clipboard.writeText(pageUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleWCAGVersionChange = (version: '2.1' | '2.2') => {
    if (!session) return;

    const updatedSession = { ...session, wcagVersion: version };
    setSession(updatedSession);
    
    // Auto-save
    autoSaveSession(updatedSession, async (sessionToSave) => {
      setSaving(true);
      try {
        saveSessionToLocalStorage(sessionToSave);
        await fetch('/api/manual-testing/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionToSave)
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleBack = () => {
    router.push('/manual-testing');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header Skeleton */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="mt-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-2 w-full" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex">
          <div className="w-96 border-r bg-card flex flex-col">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-muted/50">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Session</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Session not found</p>
            <Button onClick={handleBack} className="mt-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const criteria = getCriteriaForVersionAndLevel(session.wcagVersion, session.level);
  const summary = calculateSessionSummary(session, criteria.length);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Manual Testing Workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                WCAG {session.wcagVersion} Level {session.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </div>
            )}
            <div className="text-sm">
              <span className="font-medium">{summary.completedCriteria}</span>
              <span className="text-muted-foreground"> of {summary.totalCriteria} completed</span>
            </div>
            <Progress value={summary.progressPercent} className="w-24 h-2" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternalTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Re-open Page
            </Button>

            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Test Settings</SheetTitle>
                  <SheetDescription>
                    Configure your testing preferences and WCAG version.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WCAG Version</label>
                    <Select value={session.wcagVersion} onValueChange={handleWCAGVersionChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2.0">WCAG 2.0</SelectItem>
                        <SelectItem value="2.1">WCAG 2.1</SelectItem>
                        <SelectItem value="2.2">WCAG 2.2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Test Level</label>
                    <Select value={session.level} onValueChange={(value) => {
                      const updatedSession = { ...session, level: value as 'A' | 'AA' | 'AAA' };
                      setSession(updatedSession);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Level A</SelectItem>
                        <SelectItem value="AA">Level AA</SelectItem>
                        <SelectItem value="AAA">Level AAA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">WCAG Version:</label>
                <Select value={session.wcagVersion} onValueChange={handleWCAGVersionChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.0">2.0</SelectItem>
                    <SelectItem value="2.1">2.1</SelectItem>
                    <SelectItem value="2.2">2.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Level:</label>
                <Select value={session.level} onValueChange={(value) => {
                  const updatedSession = { ...session, level: value as 'A' | 'AA' | 'AAA' };
                  setSession(updatedSession);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AAA">AAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Compact External Tab Panel */}
        <Collapsible open={showTabPanel} onOpenChange={setShowTabPanel} className="mt-4">
          <CollapsibleTrigger asChild>
            <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Testing: {session.pageUrl}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleOpenExternalTab();
                    }} className="bg-blue-600 hover:bg-blue-700">
                      Open Page
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl();
                      }}
                    >
                      {urlCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">How to Test</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Click &quot;Open Page&quot; to open the page in a new tab</li>
                      <li>Use the checklist below to test each WCAG criterion</li>
                      <li>Test keyboard navigation, screen reader compatibility, and visual accessibility</li>
                      <li>Mark criteria as &quot;Pass&quot;, &quot;Fail&quot;, or &quot;Not Applicable&quot; as you test</li>
                    </ol>
                  </div>
                  {pageData && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Organization:</span>
                          <p className="font-medium">{pageData.organizationName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Operating Unit:</span>
                          <p className="font-medium">{pageData.operatingUnitName || pageData.departmentName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Scanned:</span>
                          <p className="font-medium">{pageData.dateScanned}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>


      </header>

      {/* Main Workspace - Full Height Checklist */}
      <div className="flex-1 flex flex-col">
        {/* WCAG Checklist - Hero Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  WCAG {session.wcagVersion} Level {session.level} Checklist
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Test each criterion against the page opened in the external tab
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {summary.completedCriteria} of {summary.totalCriteria} completed
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <WCAGManualChecklist
                session={session}
                criteria={criteria}
                onStatusChange={handleCriterionStatusChange}
                onEvidenceUpload={handleEvidenceUpload}
                onNoteUpdate={handleNoteUpdate}
                gridLayout={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
