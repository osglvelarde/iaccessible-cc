"use client";
import { useState, Fragment } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Eye, 
  Download, 
  ChevronDown, 
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanIssue {
  id: number;
  type: string;
  severity: string;
  description: string;
  location: string;
  details: string;
}

interface ScanResultsTableProps {
  issues: ScanIssue[];
  className?: string;
}

export default function ScanResultsTable({ issues, className }: ScanResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600 text-white hover:bg-red-700";
      case "warning": return "bg-amber-500 text-white hover:bg-amber-600";
      case "pass": return "bg-green-600 text-white hover:bg-green-700";
      default: return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-3 w-3" />;
      case "warning": return <Info className="h-3 w-3" />;
      case "pass": return <CheckCircle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "WCAG": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      case "SEO": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "Readability": return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle>Automated Scan Results</CardTitle>
        <CardDescription>
          Detailed breakdown of automated accessibility, SEO, and readability analysis
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Type</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Issue category (WCAG, SEO, Readability)</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Severity</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Issue severity level</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Description</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Brief description of the issue</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Location</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>CSS selector or element location</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <Fragment key={issue.id}>
                  <tr className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getTypeColor(issue.type)}>
                        {issue.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={cn("flex items-center gap-1 w-fit", getSeverityColor(issue.severity))}>
                        {getSeverityIcon(issue.severity)}
                        {issue.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate">{issue.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {issue.location}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleRow(issue.id)}
                            >
                              {expandedRows.has(issue.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{expandedRows.has(issue.id) ? "Hide details" : "Show details"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(issue.id) && (
                    <tr key={`${issue.id}-details`} className="border-b bg-muted/30">
                      <td colSpan={5} className="py-3 px-4">
                        <div className="animate-in fade-in-0 slide-in-from-top-2">
                          <p className="text-sm text-muted-foreground font-medium mb-1">Details:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{issue.details}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {issues.map((issue) => (
            <Card key={issue.id} className="shadow-sm">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getTypeColor(issue.type)}>
                        {issue.type}
                      </Badge>
                      <Badge className={cn("flex items-center gap-1", getSeverityColor(issue.severity))}>
                        {getSeverityIcon(issue.severity)}
                        {issue.severity}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{issue.description}</h3>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono block">
                      {issue.location}
                    </code>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleRow(issue.id)}
                  >
                    {expandedRows.has(issue.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {expandedRows.has(issue.id) && (
                  <div className="pt-2 border-t animate-in fade-in-0 slide-in-from-top-2">
                    <p className="text-sm text-muted-foreground">{issue.details}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download formatted PDF report</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download CSV for data analysis</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download JSON for integration</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}
