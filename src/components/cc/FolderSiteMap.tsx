"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Folder, 
  FolderOpen, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown,
  Link as LinkIcon,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageNode {
  id: string;
  title: string;
  url: string;
  type: "internal" | "external";
  children: PageNode[];
}

interface ScanData {
  id: number;
  date: string;
  website: string;
  pages: PageNode[];
}

interface FolderSiteMapProps {
  scanData: ScanData;
  pageFilter: "all" | "internal" | "external";
  onFolderSelect: (folderId: string | null) => void;
  onNavigateToThumbnail: () => void;
  className?: string;
}

export default function FolderSiteMap({ 
  scanData, 
  pageFilter, 
  onFolderSelect, 
  onNavigateToThumbnail,
  className 
}: FolderSiteMapProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    onFolderSelect(folderId);
  };

  const filterPages = (pages: PageNode[]): PageNode[] => {
    return pages.filter(page => {
      if (pageFilter === "all") return true;
      if (pageFilter === "internal") return page.type === "internal";
      if (pageFilter === "external") return page.type === "external";
      return true;
    }).map(page => ({
      ...page,
      children: filterPages(page.children)
    }));
  };

  const renderPageNode = (page: PageNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(page.id);
    const isSelected = selectedFolder === page.id;
    const hasChildren = page.children.length > 0;
    const filteredChildren = filterPages(page.children);

    return (
      <div key={page.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
            isSelected && "bg-primary/10 border border-primary/20",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${level * 1.5}rem` }}
          onClick={() => {
            if (hasChildren) {
              toggleFolder(page.id);
            }
            selectFolder(page.id);
          }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </div>

          {/* Folder Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Page Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{page.title}</span>
              {page.type === "external" && (
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {page.url}
            </div>
          </div>

          {/* Page Type Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              page.type === "internal" 
                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
            )}
          >
            {page.type}
          </Badge>

          {/* Child Count */}
          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {filteredChildren.length} pages
            </Badge>
          )}

          {/* Navigation to Thumbnail View */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  selectFolder(page.id);
                  onNavigateToThumbnail();
                }}
                className="h-6 w-6 p-0"
              >
                <LinkIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View in Thumbnail Site Map</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-in fade-in-0 slide-in-from-top-2">
            {filteredChildren.map(child => renderPageNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredPages = filterPages(scanData.pages);

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Folder Site Map
        </CardTitle>
        <CardDescription>
          Hierarchical view of scanned website structure
          {pageFilter !== "all" && (
            <span className="ml-2">
              • Showing {pageFilter} pages only
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        {filteredPages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pages found matching your filter criteria</p>
            <p className="text-sm mt-1">
              Try adjusting the page type filter or select a different scan period
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPages.map(page => renderPageNode(page))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-blue-600" />
              <span>Folder with pages</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-amber-600" />
              <span>External page</span>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span>View in Thumbnail Map</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
