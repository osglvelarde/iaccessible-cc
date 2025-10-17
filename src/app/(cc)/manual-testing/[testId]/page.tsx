'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import PageContentViewer from '@/components/cc/PageContentViewer';

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

  useEffect(() => {
    if (testId) {
      initializeSession();
    }
  }, [testId, pageUrl]);

  const initializeSession = async () => {
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
          foundPage?.departmentName || 'Unknown',
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
  };

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading test session...</p>
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
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-6 py-4">
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
              <h1 className="text-xl font-semibold text-foreground">
                Manual Testing Workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                WCAG {session.wcagVersion} Level {session.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </div>
            )}
            <Select value={session.wcagVersion} onValueChange={handleWCAGVersionChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2.1">2.1</SelectItem>
                <SelectItem value="2.2">2.2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Page Info */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Page Under Test:</span>
          <Badge variant="outline" className="text-xs">{session.pageUrl}</Badge>
        </div>

        {/* Metadata */}
        {pageData && (
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>Department: <span className="font-medium text-foreground">{pageData.departmentName}</span></span>
            <Separator orientation="vertical" className="h-4" />
            <span>Organization: <span className="font-medium text-foreground">{pageData.organizationName}</span></span>
            <Separator orientation="vertical" className="h-4" />
            <span>Scanned: <span className="font-medium text-foreground">{pageData.dateScanned}</span></span>
          </div>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress: {summary.completedCriteria} of {summary.totalCriteria} criteria tested</span>
            <span>{summary.progressPercent}%</span>
          </div>
          <Progress value={summary.progressPercent} className="h-2" />
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex">
        {/* Left Panel - WCAG Checklist */}
        <div className="w-96 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-foreground">
              WCAG {session.wcagVersion} Level {session.level} Checklist
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Check each criterion against the current page
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <WCAGManualChecklist
              session={session}
              criteria={criteria}
              onStatusChange={handleCriterionStatusChange}
              onEvidenceUpload={handleEvidenceUpload}
              onNoteUpdate={handleNoteUpdate}
            />
          </div>
        </div>

        {/* Right Panel - Content Viewer */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Content Viewer</h3>
                <Badge variant="outline" className="text-xs">
                  Page
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <PageContentViewer url={session.pageUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
