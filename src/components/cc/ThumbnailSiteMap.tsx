"use client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ExternalLink, 
  FileText, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Eye,
  Calendar,
  Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbnailData {
  id: string;
  url: string;
  title: string;
  webpages: number;
  documents: number;
  accessibilityStatus: "compliant" | "needs-work" | "not-scanned";
  plainLanguageStatus: "excellent" | "good" | "needs-work" | "not-scanned";
  lastScanned: string;
}

interface ThumbnailSiteMapProps {
  thumbnailData: ThumbnailData[];
  pageFilter: "all" | "internal" | "external";
  selectedFolder?: string | null;
  className?: string;
}

export default function ThumbnailSiteMap({ 
  thumbnailData, 
  pageFilter, 
  selectedFolder,
  className 
}: ThumbnailSiteMapProps) {
  const getStatusColor = (status: string, type: "accessibility" | "plainLanguage") => {
    const baseColors = {
      accessibility: {
        "compliant": "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
        "needs-work": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
        "not-scanned": "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
      },
      plainLanguage: {
        "excellent": "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
        "good": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
        "needs-work": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
        "not-scanned": "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
      }
    };
    return baseColors[type][status as keyof typeof baseColors[type]] || baseColors[type]["not-scanned"];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
      case "excellent":
        return <CheckCircle className="h-3 w-3" />;
      case "needs-work":
        return <AlertTriangle className="h-3 w-3" />;
      case "not-scanned":
        return <Info className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: string, type: "accessibility" | "plainLanguage") => {
    if (type === "accessibility") {
      switch (status) {
        case "compliant": return "Compliant";
        case "needs-work": return "Needs Work";
        case "not-scanned": return "Not Scanned";
        default: return "Unknown";
      }
    } else {
      switch (status) {
        case "excellent": return "Excellent";
        case "good": return "Good";
        case "needs-work": return "Needs Work";
        case "not-scanned": return "Not Scanned";
        default: return "Unknown";
      }
    }
  };

  const isExternalPage = (url: string) => {
    return !url.includes(window.location.hostname);
  };

  const filteredData = thumbnailData.filter(item => {
    if (pageFilter === "all") return true;
    if (pageFilter === "internal") return !isExternalPage(item.url);
    if (pageFilter === "external") return isExternalPage(item.url);
    return true;
  });

  const selectedData = selectedFolder 
    ? filteredData.filter(item => item.id === selectedFolder)
    : filteredData;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Thumbnail Site Map
        </CardTitle>
        <CardDescription>
          Visual performance metrics for webpages and child pages
          {pageFilter !== "all" && (
            <span className="ml-2">
              • Showing {pageFilter} pages only
            </span>
          )}
          {selectedFolder && (
            <span className="ml-2">
              • Filtered by selected folder
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        {selectedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pages found matching your filter criteria</p>
            <p className="text-sm mt-1">
              Try adjusting the page type filter or select a different folder
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedData.map((item, index) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Card 
                    className={cn(
                      "shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group",
                      "animate-in fade-in-0 slide-in-from-bottom-2"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate flex items-center gap-1">
                            {item.title}
                            {isExternalPage(item.url) && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground truncate mt-1">
                            {item.url}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <div className="px-6 pb-6 space-y-3">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                              <div className="text-lg font-bold text-blue-600">{item.webpages}</div>
                              <div className="text-xs text-muted-foreground">Webpages</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of child pages included</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center p-2 rounded bg-purple-50 dark:bg-purple-950/20">
                              <div className="text-lg font-bold text-purple-600">{item.documents}</div>
                              <div className="text-xs text-muted-foreground">Documents</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of documents (PDFs, etc.) associated with this page</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Status Badges */}
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Accessibility</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  getStatusColor(item.accessibilityStatus, "accessibility")
                                )}
                              >
                                {getStatusIcon(item.accessibilityStatus)}
                                {getStatusText(item.accessibilityStatus, "accessibility")}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Aggregated accessibility compliance for this page and its child pages</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Plain Language</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  getStatusColor(item.plainLanguageStatus, "plainLanguage")
                                )}
                              >
                                {getStatusIcon(item.plainLanguageStatus)}
                                {getStatusText(item.plainLanguageStatus, "plainLanguage")}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Aggregated plain language / readability compliance for this page and child pages</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Last Scanned */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Last scanned {new Date(item.lastScanned).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs opacity-90">{item.url}</p>
                    <p className="text-xs opacity-90">
                      {item.webpages} webpages • {item.documents} documents
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {selectedData.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedData.reduce((sum, item) => sum + item.webpages, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Webpages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {selectedData.reduce((sum, item) => sum + item.documents, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {selectedData.filter(item => item.accessibilityStatus === "compliant").length}
                </div>
                <div className="text-sm text-muted-foreground">Accessible Pages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedData.filter(item => item.plainLanguageStatus === "excellent" || item.plainLanguageStatus === "good").length}
                </div>
                <div className="text-sm text-muted-foreground">Plain Language</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
