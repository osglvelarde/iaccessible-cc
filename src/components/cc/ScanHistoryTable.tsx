"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Eye, 
  Download, 
  RotateCcw, 
  Search, 
  Filter,
  Calendar,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanHistoryItem {
  id: number;
  url: string;
  date: string;
  status: "completed" | "failed" | "running";
  accessibilityScore?: number;
  seoScore?: number;
  readabilityScore?: number;
}

interface ScanHistoryTableProps {
  history: ScanHistoryItem[];
  className?: string;
}

export default function ScanHistoryTable({ history, className }: ScanHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        const scoreA = a.accessibilityScore || 0;
        const scoreB = b.accessibilityScore || 0;
        return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "failed": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700";
      case "running": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle>Scan History</CardTitle>
        <CardDescription>
          View and manage your previous scans
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show all scans</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("completed")}
                >
                  Completed
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show only completed scans</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={statusFilter === "failed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("failed")}
                >
                  Failed
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show only failed scans</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="flex items-center gap-1 cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSortBy("date");
                          setSortOrder(sortBy === "date" && sortOrder === "desc" ? "asc" : "desc");
                        }}
                      >
                        <Calendar className="h-4 w-4" />
                        Date
                        {sortBy === "date" && (sortOrder === "desc" ? "↓" : "↑")}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to sort by date</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">URL</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="flex items-center gap-1 cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSortBy("score");
                          setSortOrder(sortBy === "score" && sortOrder === "desc" ? "asc" : "desc");
                        }}
                      >
                        Scores
                        {sortBy === "score" && (sortOrder === "desc" ? "↓" : "↑")}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to sort by accessibility score</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((scan) => (
                <tr key={scan.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {new Date(scan.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(scan.date).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate text-sm">{scan.url}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {scan.status === "completed" ? (
                      <div className="flex gap-2 text-sm">
                        <span className="text-blue-600 font-medium">{scan.accessibilityScore}%</span>
                        <span className="text-green-600">{scan.seoScore}%</span>
                        <span className="text-purple-600">{scan.readabilityScore}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View detailed results</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Export PDF</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Run scan again</p>
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
          {filteredHistory.map((scan) => (
            <Card key={scan.id} className="shadow-sm">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{scan.url}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(scan.date).toLocaleDateString()} at {new Date(scan.date).toLocaleTimeString()}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(scan.status))}>
                      {scan.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View detailed results</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export PDF</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Run scan again</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                {scan.status === "completed" && (
                  <div className="pt-2 border-t">
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Accessibility: </span>
                        <span className="text-blue-600 font-medium">{scan.accessibilityScore}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SEO: </span>
                        <span className="text-green-600">{scan.seoScore}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Readability: </span>
                        <span className="text-purple-600">{scan.readabilityScore}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No scans found matching your criteria</p>
          </div>
        )}
      </div>
    </Card>
  );
}
