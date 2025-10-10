"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  X, 
  Copy, 
  ExternalLink, 
  Home, 
  FileText, 
  Calendar, 
  Clock, 
  Globe,
  Send,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SitemapPage {
  url: string;
  parentUrl?: string;
  relation: 'Internal' | 'External';
  domain: string;
  fileType: string;
  isPdf: boolean;
  depth: number;
  lastModified?: string;
  scannedAt: string;
  title?: string;
  statusCode?: number;
}

interface SitemapDetailsDrawerProps {
  page: SitemapPage | null;
  isOpen: boolean;
  onClose: () => void;
  onSendTo: (tool: 'Webpage Scan' | 'Readability' | 'WAVE') => void;
}

export default function SitemapDetailsDrawer({ 
  page, 
  isOpen, 
  onClose, 
  onSendTo 
}: SitemapDetailsDrawerProps) {
  if (!isOpen || !page) return null;

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'HTML': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      case 'PDF': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      case 'CSS': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
      case 'JS': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getRelationIcon = (relation: string) => {
    return relation === 'Internal' ? <Home className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPathBreadcrumbs = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
      return pathSegments.map((segment, index) => ({
        name: segment,
        path: '/' + pathSegments.slice(0, index + 1).join('/')
      }));
    } catch {
      return [];
    }
  };

  const breadcrumbs = getPathBreadcrumbs(page.url);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Page Details</h2>
              <p className="text-sm text-muted-foreground">Detailed information about this page</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* URL and Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">URL & Status</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono break-all">{page.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(page.url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getRelationIcon(page.relation)}
                    {page.relation}
                  </Badge>
                  <Badge variant="outline" className={getFileTypeColor(page.fileType)}>
                    {page.fileType}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Meta Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Meta Information</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Domain:</span>
                    <p className="font-medium">{page.domain}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Depth:</span>
                    <p className="font-medium">{page.depth}</p>
                  </div>
                </div>

                {page.parentUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">Parent URL:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm font-mono break-all flex-1">{page.parentUrl}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(page.parentUrl!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Last Modified:</span>
                    <p className="font-medium">
                      {page.lastModified ? formatDate(page.lastModified) : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scanned At:</span>
                    <p className="font-medium">{formatDate(page.scannedAt)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Path Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Path Breadcrumbs</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="text-muted-foreground">/</span>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">{crumb.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => onSendTo('Webpage Scan')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Send to Webpage Scan
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => onSendTo('Readability')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Send to Readability
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => onSendTo('WAVE')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Send to WAVE
                </Button>
              </div>
            </Card>

            {/* Secondary Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  Outlink domains and additional metadata are available in the export data.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

