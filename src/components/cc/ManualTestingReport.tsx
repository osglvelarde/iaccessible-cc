'use client';

import React, { useState } from 'react';
import { Download, FileText, Image, Video, Music, Code, Calendar, ExternalLink, CheckCircle, XCircle, AlertCircle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TestSession, getCriterionResult, getStatusBadgeVariant, formatDate, calculateSessionSummary } from '@/lib/manual-testing';
import { WCAG_PRINCIPLES, WCAGCriterion, groupCriteriaByPrinciple } from '@/lib/wcag-complete';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ManualTestingReportProps {
  session: TestSession;
  criteria: WCAGCriterion[];
  testId: string;
}

export default function ManualTestingReport({ session, criteria, testId }: ManualTestingReportProps) {
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<string>>(
    new Set(['1', '2', '3', '4']) // Expand all principles by default in report view
  );
  const [exporting, setExporting] = useState(false);

  const groupedCriteria = groupCriteriaByPrinciple(criteria);
  const summary = calculateSessionSummary(session, criteria.length);

  const togglePrinciple = (principleId: string) => {
    const newExpanded = new Set(expandedPrinciples);
    if (newExpanded.has(principleId)) {
      newExpanded.delete(principleId);
    } else {
      newExpanded.add(principleId);
    }
    setExpandedPrinciples(newExpanded);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/manual-testing/export?testId=${testId}`);
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manual-test-${testId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'Photo':
        return <Image className="h-3 w-3" />;
      case 'Video':
        return <Video className="h-3 w-3" />;
      case 'Audio':
        return <Music className="h-3 w-3" />;
      case 'Code Snippet':
        return <Code className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Needs Senior Review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'N/A':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manual Testing Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive accessibility assessment results
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={exporting} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export to CSV'}
        </Button>
      </div>

      {/* Test Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Page URL</p>
              <div className="flex items-center gap-2 mt-1">
                <a 
                  href={session.pageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  {session.pageUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="text-sm font-medium mt-1">{session.organization}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department / Operating Unit</p>
              <p className="text-sm font-medium mt-1">{session.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WCAG Version</p>
              <p className="text-sm font-medium mt-1">WCAG {session.wcagVersion}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Test Level</p>
              <p className="text-sm font-medium mt-1">Level {session.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Test ID</p>
              <p className="text-sm font-mono mt-1">{session.testId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started At</p>
              <p className="text-sm font-medium mt-1">{formatDate(session.startedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium mt-1">{formatDate(session.lastUpdatedAt)}</p>
            </div>
            {session.testerName && (
              <div>
                <p className="text-sm text-muted-foreground">Tester</p>
                <p className="text-sm font-medium mt-1">{session.testerName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{summary.totalCriteria}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Criteria</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{summary.passCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Passed</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{summary.failCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Failed</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{summary.needsReviewCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Needs Review</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{summary.naCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Not Applicable</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progress</p>
              <p className="text-sm text-muted-foreground">{summary.progressPercent}%</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${summary.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.completedCriteria} of {summary.totalCriteria} criteria completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Criteria Report */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Criteria Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
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
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg text-foreground">
                              {principle.id}. {principle.name}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {principle.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {principleCriteria.length} criteria
                            </div>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">WCAG ID</TableHead>
                            <TableHead>Criterion Title</TableHead>
                            <TableHead className="w-[80px]">Level</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead className="w-[100px]">Evidence</TableHead>
                            <TableHead className="w-[150px]">Last Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {principleCriteria.map((criterion) => {
                            const result = getCriterionResult(session, criterion.wcagId);
                            const status = result?.status || 'Not Tested';

                            return (
                              <TableRow key={criterion.wcagId}>
                                <TableCell className="font-mono text-sm">
                                  {criterion.wcagId}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{criterion.title}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {criterion.level}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(status)}
                                    <Badge variant={getStatusBadgeVariant(status as any)}>
                                      {status}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {result?.note ? (
                                    <div className="max-w-xs">
                                      <p className="text-sm line-clamp-2">{result.note}</p>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {result?.evidence && result.evidence.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {result.evidence.map((evidence) => (
                                        <div 
                                          key={evidence.id} 
                                          className="flex items-center gap-1 text-xs text-muted-foreground"
                                        >
                                          {getEvidenceIcon(evidence.type)}
                                          <span className="truncate max-w-[80px]">{evidence.filename}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {result?.lastUpdated ? formatDate(result.lastUpdated) : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}


