"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Folder, 
  FolderOpen, 
  ExternalLink, 
  Calendar,
  Filter,
  Grid3X3,
  List,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";
import FolderSiteMap from "@/components/cc/FolderSiteMap";
import ThumbnailSiteMap from "@/components/cc/ThumbnailSiteMap";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockScanData = [
  {
    id: 1,
    date: "2024-01-15T10:30:00Z",
    website: "example.gov",
    pages: [
      {
        id: "home",
        title: "Homepage",
        url: "https://example.gov",
        type: "internal",
        children: [
          {
            id: "about",
            title: "About Us",
            url: "https://example.gov/about",
            type: "internal",
            children: [
              {
                id: "team",
                title: "Our Team",
                url: "https://example.gov/about/team",
                type: "internal",
                children: []
              }
            ]
          },
          {
            id: "services",
            title: "Services",
            url: "https://example.gov/services",
            type: "internal",
            children: [
              {
                id: "web-design",
                title: "Web Design",
                url: "https://example.gov/services/web-design",
                type: "internal",
                children: []
              },
              {
                id: "accessibility",
                title: "Accessibility Services",
                url: "https://example.gov/services/accessibility",
                type: "internal",
                children: []
              }
            ]
          },
          {
            id: "external-partner",
            title: "Partner Organization",
            url: "https://partner.org",
            type: "external",
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 2,
    date: "2024-01-10T14:20:00Z",
    website: "demo.gov",
    pages: [
      {
        id: "home",
        title: "Demo Homepage",
        url: "https://demo.gov",
        type: "internal",
        children: [
          {
            id: "resources",
            title: "Resources",
            url: "https://demo.gov/resources",
            type: "internal",
            children: []
          }
        ]
      }
    ]
  }
];

const mockThumbnailData = [
  {
    id: "home",
    url: "https://example.gov",
    title: "Homepage",
    webpages: 5,
    documents: 3,
    accessibilityStatus: "compliant",
    plainLanguageStatus: "good",
    lastScanned: "2024-01-15T10:30:00Z"
  },
  {
    id: "about",
    url: "https://example.gov/about",
    title: "About Us",
    webpages: 2,
    documents: 1,
    accessibilityStatus: "needs-work",
    plainLanguageStatus: "excellent",
    lastScanned: "2024-01-15T10:30:00Z"
  },
  {
    id: "services",
    url: "https://example.gov/services",
    title: "Services",
    webpages: 3,
    documents: 2,
    accessibilityStatus: "compliant",
    plainLanguageStatus: "good",
    lastScanned: "2024-01-15T10:30:00Z"
  },
  {
    id: "external-partner",
    url: "https://partner.org",
    title: "Partner Organization",
    webpages: 0,
    documents: 0,
    accessibilityStatus: "not-scanned",
    plainLanguageStatus: "not-scanned",
    lastScanned: "2024-01-15T10:30:00Z"
  }
];

export default function SitemapPage() {
  const [selectedView, setSelectedView] = useState<"folder" | "thumbnail">("folder");
  const [selectedScan, setSelectedScan] = useState(mockScanData[0]);
  const [pageFilter, setPageFilter] = useState<"all" | "internal" | "external">("all");
  const [dateFilter, setDateFilter] = useState("2024-01");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const availableDates = Array.from(new Set(
    mockScanData.map(scan => 
      new Date(scan.date).toISOString().slice(0, 7) // YYYY-MM format
    )
  )).sort().reverse();

  const filteredScans = mockScanData.filter(scan => 
    new Date(scan.date).toISOString().slice(0, 7) === dateFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700";
      case "needs-work": return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700";
      case "not-scanned": return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="h-3 w-3" />;
      case "needs-work": return <AlertTriangle className="h-3 w-3" />;
      case "not-scanned": return <Info className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "compliant": return "Compliant";
      case "needs-work": return "Needs Work";
      case "not-scanned": return "Not Scanned";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Sitemap Monitoring</h1>
            <Badge variant="outline" className="text-sm">
              Site Structure Analysis
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Command Center
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters and Controls */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
            <CardDescription>
              Configure your view and filter scan results by date and page type
            </CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Scan Period</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Type</label>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={pageFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPageFilter("all")}
                      >
                        All Pages
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show both internal and external pages</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={pageFilter === "internal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPageFilter("internal")}
                      >
                        Internal Only
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show only pages from the same domain</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={pageFilter === "external" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPageFilter("external")}
                      >
                        External Only
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show only external links and references</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* View Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">View Mode</label>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedView === "folder" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedView("folder")}
                      >
                        <List className="h-4 w-4 mr-2" />
                        Folder View
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hierarchical folder structure</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedView === "thumbnail" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedView("thumbnail")}
                      >
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Thumbnail View
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Visual performance metrics</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Scan Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selected Scan
            </CardTitle>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">{selectedScan.website}</h3>
                <p className="text-sm text-muted-foreground">
                  Scanned on {new Date(selectedScan.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {selectedScan.pages.length} Root Pages
                </Badge>
                <Badge variant="outline">
                  {selectedScan.pages.reduce((total, page) => 
                    total + 1 + countAllChildren(page), 0
                  )} Total Pages
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as "folder" | "thumbnail")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="folder" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Folder Site Map
            </TabsTrigger>
            <TabsTrigger value="thumbnail" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Thumbnail Site Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="folder" className="mt-6">
            <FolderSiteMap
              scanData={selectedScan}
              pageFilter={pageFilter}
              onFolderSelect={setSelectedFolder}
              onNavigateToThumbnail={() => setSelectedView("thumbnail")}
            />
          </TabsContent>

          <TabsContent value="thumbnail" className="mt-6">
            <ThumbnailSiteMap
              thumbnailData={mockThumbnailData}
              pageFilter={pageFilter}
              selectedFolder={selectedFolder}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper function to count all children recursively
function countAllChildren(page: any): number {
  return page.children.reduce((total: number, child: any) => 
    total + 1 + countAllChildren(child), 0
  );
}
