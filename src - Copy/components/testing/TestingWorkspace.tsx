import { useState, useEffect } from 'react';
import { ChevronLeft, ExternalLink, Settings, Info, Eye, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WCAGChecklist } from './WCAGChecklist';
import { ContentViewer } from './ContentViewer';
import type { Report, WCAGVersion, WCAGLevel } from '@/types';

interface TestingWorkspaceProps {
  report: Partial<Report>;
  onBack: () => void;
}

export const TestingWorkspace = ({ report, onBack }: TestingWorkspaceProps) => {
  // Set currentPageUrl to the first URL in report.urls
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');

  // Type guards for WCAGVersion and WCAGLevel
  const WCAG_VERSIONS: WCAGVersion[] = ['2.1', '2.2'];
  const WCAG_LEVELS: WCAGLevel[] = ['A', 'AA', 'AAA'];

  function getValidWcagVersion(value: any): WCAGVersion {
    return WCAG_VERSIONS.includes(value) ? value : '2.2';
  }
  function getValidWcagLevel(value: any): WCAGLevel {
    return WCAG_LEVELS.includes(value) ? value : 'AA';
  }

  useEffect(() => {
    const urls = Array.isArray(report?.suggestedPages) ? report.suggestedPages : [];
    if (urls.length > 0) {
      setCurrentPageUrl(urls[0]);
    } else {
      setCurrentPageUrl('');
    }
  }, [report]);

  const [wcagVersion, setWcagVersion] = useState<WCAGVersion>(
    getValidWcagVersion(report.standards?.[0])
  );
  const [wcagLevel, setWcagLevel] = useState<WCAGLevel>(
    getValidWcagLevel(report.level)
  );
  const [showCrosswalk, setShowCrosswalk] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Testing Workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                WCAG {wcagVersion} Level {wcagLevel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                    Preview
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preview report in new window</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              Settings
            </Button>
          </div>
        </div>
        {/* Show current page URL as a badge or read-only input */}
        {currentPageUrl && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Page Under Test:</span>
            <Badge variant="outline" className="text-xs">{currentPageUrl}</Badge>
          </div>
        )}
        {/* Standards Toggle */}
        <div className="flex items-center justify-between mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="wcag-version" className="text-sm font-medium">
                WCAG Version:
              </label>
              <select
                id="wcag-version"
                value={wcagVersion}
                onChange={e => setWcagVersion(e.target.value as WCAGVersion)}
                className="w-20 border rounded px-2 py-1 text-sm"
              >
                <option value="2.1">2.1</option>
                <option value="2.2">2.2</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="wcag-level" className="text-sm font-medium">
                Level:
              </label>
              <select
                id="wcag-level"
                value={wcagLevel}
                onChange={e => setWcagLevel(e.target.value as WCAGLevel)}
                className="w-16 border rounded px-2 py-1 text-sm"
              >
                <option value="A">A</option>
                <option value="AA">AA</option>
                <option value="AAA">AAA</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showCrosswalk ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setShowCrosswalk(!showCrosswalk)}
            >
              <Info className="h-4 w-4 mr-2" aria-hidden="true" />
              {showCrosswalk ? 'Hide' : 'Show'} Crosswalk
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Shows mapping to Section 508 and ADA Title II for reference.
                    Pass/fail counts are based on WCAG selection.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex">
        {/* Left Panel - WCAG Checklist */}
        <div className="w-96 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-foreground">
              WCAG {wcagVersion} Level {wcagLevel} Checklist
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Check each criterion against the current page
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <WCAGChecklist
              wcagVersion={wcagVersion}
              wcagLevel={wcagLevel}
              showCrosswalk={showCrosswalk}
              pageId={""}
              reportId={report.id || ''}
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Keyboard className="h-4 w-4 mr-2" aria-hidden="true" />
                  Keyboard Mode
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                  Open in Tab
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ContentViewer
              url={currentPageUrl}
              scopeType={report.scopeType || 'web'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
