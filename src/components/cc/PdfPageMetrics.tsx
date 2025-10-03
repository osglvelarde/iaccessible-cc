"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Image, Type, List, Table, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageMetric {
  pageNumber: number;
  mediaBox: string;
  textCount: number;
  wordCount: number;
  imageCount: number;
  annotationCount: number;
  hasAltText: boolean;
  headings: string[];
  lists: number;
  tables: number;
}

interface PdfPageMetricsProps {
  metrics: PageMetric[];
  className?: string;
}

export default function PdfPageMetrics({ metrics, className }: PdfPageMetricsProps) {
  const getAccessibilityScore = (page: PageMetric) => {
    let score = 100;
    if (!page.hasAltText && page.imageCount > 0) score -= 20;
    if (page.headings.length === 0) score -= 15;
    if (page.tables > 0 && page.headings.length === 0) score -= 10;
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
    if (score >= 70) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700";
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Page-Level Metrics
        </CardTitle>
        <CardDescription>
          Detailed analysis of each page's content and accessibility features
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="space-y-4">
          {metrics.map((page, index) => {
            const score = getAccessibilityScore(page);
            return (
              <div key={page.pageNumber} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Page {page.pageNumber}</h3>
                    <Badge variant="outline" className={getScoreBadgeColor(score)}>
                      {score}% Accessible
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Media Box: {page.mediaBox}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Content Metrics */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                        <Type className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">{page.textCount}</div>
                          <div className="text-xs text-muted-foreground">Characters</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total text characters on this page</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20">
                        <Type className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">{page.wordCount}</div>
                          <div className="text-xs text-muted-foreground">Words</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total words on this page</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded bg-purple-50 dark:bg-purple-950/20">
                        <Image className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium">{page.imageCount}</div>
                          <div className="text-xs text-muted-foreground">Images</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of images on this page</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                        <MessageSquare className="h-4 w-4 text-amber-600" />
                        <div>
                          <div className="text-sm font-medium">{page.annotationCount}</div>
                          <div className="text-xs text-muted-foreground">Annotations</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of annotations on this page</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded bg-indigo-50 dark:bg-indigo-950/20">
                        <List className="h-4 w-4 text-indigo-600" />
                        <div>
                          <div className="text-sm font-medium">{page.lists}</div>
                          <div className="text-xs text-muted-foreground">Lists</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of lists on this page</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded bg-cyan-50 dark:bg-cyan-950/20">
                        <Table className="h-4 w-4 text-cyan-600" />
                        <div>
                          <div className="text-sm font-medium">{page.tables}</div>
                          <div className="text-xs text-muted-foreground">Tables</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of tables on this page</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Accessibility Features */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "flex items-center gap-1",
                            page.hasAltText 
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                              : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                          )}
                        >
                          {page.hasAltText ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          Alt Text
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{page.hasAltText ? "Images have alternative text" : "Images missing alternative text"}</p>
                      </TooltipContent>
                    </Tooltip>

                    {page.headings.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Headings: {page.headings.join(", ")}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Heading structure found on this page</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {page.headings.length === 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            No Headings
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>No heading structure found on this page</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.reduce((sum, page) => sum + page.textCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Characters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.reduce((sum, page) => sum + page.wordCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.reduce((sum, page) => sum + page.imageCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Images</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {Math.round(metrics.reduce((sum, page) => sum + getAccessibilityScore(page), 0) / metrics.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Accessibility</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
