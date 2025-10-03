"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  Download,
  FileText,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfIssue {
  id: number;
  type: string;
  code: string;
  severity: "Error" | "Warning" | "Need Check Manual";
  message: string;
  iso32000Clause: string;
  iso14289Clause: string;
  pageNumber: number;
  objectId: string;
  details: string;
}

interface PdfResultsTableProps {
  issues: PdfIssue[];
  className?: string;
}

export default function PdfResultsTable({ issues, className }: PdfResultsTableProps) {
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
      case "Error": return "bg-red-600 text-white hover:bg-red-700";
      case "Warning": return "bg-amber-500 text-white hover:bg-amber-600";
      case "Need Check Manual": return "bg-blue-600 text-white hover:bg-blue-700";
      default: return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Error": return <AlertTriangle className="h-3 w-3" />;
      case "Warning": return <Info className="h-3 w-3" />;
      case "Need Check Manual": return <CheckCircle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Text": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      case "Headings": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "Tables": return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700";
      case "Forms": return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700";
      case "Graphics": return "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700";
      case "Annotations": return "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Detailed Issue Analysis
        </CardTitle>
        <CardDescription>
          Comprehensive breakdown of PDF accessibility issues with ISO standard references
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
                      <p>Issue category (Text, Headings, Tables, Forms, Graphics, Annotations)</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Code</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique rule identifier (e.g., 7.1:1.1)</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Severity</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Issue severity level (Error, Warning, Need Check Manual)</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Message</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Description of the accessibility issue</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">ISO References</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ISO 32000-2 and ISO 14289-1 clause references</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Location</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Page number and object ID where the issue occurs</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={getTypeColor(issue.type)}>
                      {issue.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {issue.code}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={cn("flex items-center gap-1 w-fit", getSeverityColor(issue.severity))}>
                      {getSeverityIcon(issue.severity)}
                      {issue.severity}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="truncate">{issue.message}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="text-muted-foreground">32000-2:</span> {issue.iso32000Clause}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">14289-1:</span> {issue.iso14289Clause}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="text-sm">Page {issue.pageNumber}</div>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                        {issue.objectId}
                      </code>
                    </div>
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
                          <p>{expandedRows.has(issue.id) ? "Hide remediation details" : "Show remediation details"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
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
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className={getTypeColor(issue.type)}>
                        {issue.type}
                      </Badge>
                      <Badge className={cn("flex items-center gap-1", getSeverityColor(issue.severity))}>
                        {getSeverityIcon(issue.severity)}
                        {issue.severity}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{issue.message}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div><span className="font-medium">Code:</span> <code className="bg-muted px-1 py-0.5 rounded text-xs">{issue.code}</code></div>
                      <div><span className="font-medium">Page:</span> {issue.pageNumber} • <span className="font-medium">Object:</span> <code className="bg-muted px-1 py-0.5 rounded text-xs">{issue.objectId}</code></div>
                      <div><span className="font-medium">ISO 32000-2:</span> {issue.iso32000Clause}</div>
                      <div><span className="font-medium">ISO 14289-1:</span> {issue.iso14289Clause}</div>
                    </div>
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Remediation Guidance</h4>
                      <p className="text-sm text-muted-foreground">{issue.details}</p>
                    </div>
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
                Export PDF Report
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download formatted PDF accessibility report</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export HTML
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download HTML accessibility report</p>
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
                <Code className="h-4 w-4 mr-2" />
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
