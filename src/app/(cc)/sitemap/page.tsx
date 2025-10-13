"use client";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Filter, 
  X, 
  Search,
  Home,
  ExternalLink,
  FileText,
  Folder, 
  FolderOpen, 
  ChevronDown,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Eye,
  Calendar,
  Globe,
  BarChart3,
  PieChart,
  Hash,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
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

interface SitemapSummary {
  totalPages: number;
  internalPages: number;
  externalPages: number;
  pdfCount: number;
  pdfPercentage: number;
  fileTypes: { [key: string]: number };
  topDomains: { domain: string; count: number }[];
  maxDepth: number;
}

interface FilterState {
  search: string;
  relation: 'Internal' | 'External' | 'All';
  fileTypes: string[];
  domains: string[];
  pathPrefix: string;
  includeRegex: string;
  excludeRegex: string;
  depth: [number, number];
  scannedDateRange: [string, string];
  lastModifiedRange: [string, string];
  orphanCandidates: boolean;
}

// Mock data
const mockSitemapData: SitemapPage[] = [
  {
    url: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-15T10:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Homepage"
  },
  {
    url: "https://example.gov/about",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-14T09:15:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "About Us"
  },
  {
    url: "https://example.gov/about/team",
    parentUrl: "https://example.gov/about",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 2,
    lastModified: "2024-01-13T14:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Our Team"
  },
  {
    url: "https://example.gov/services",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-12T11:45:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Services"
  },
  {
    url: "https://example.gov/documents/report.pdf",
    parentUrl: "https://example.gov/services",
    relation: "Internal",
    domain: "example.gov",
    fileType: "PDF",
    isPdf: true,
    depth: 2,
    lastModified: "2024-01-10T16:30:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Annual Report"
  },
  {
    url: "https://partner.org",
    relation: "External",
    domain: "partner.org",
    fileType: "HTML",
    isPdf: false,
    depth: 0,
    lastModified: "2024-01-11T08:00:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Partner Organization"
  },
  {
    url: "https://example.gov/contact",
    parentUrl: "https://example.gov",
    relation: "Internal",
    domain: "example.gov",
    fileType: "HTML",
    isPdf: false,
    depth: 1,
    lastModified: "2024-01-09T13:20:00Z",
    scannedAt: "2024-01-15T10:30:00Z",
    title: "Contact Us"
  }
];

const mockSummary: SitemapSummary = {
  totalPages: 7,
  internalPages: 6,
  externalPages: 1,
  pdfCount: 1,
  pdfPercentage: 14.3,
  fileTypes: { "HTML": 6, "PDF": 1 },
  topDomains: [
    { domain: "example.gov", count: 6 },
    { domain: "partner.org", count: 1 }
  ],
  maxDepth: 2
};

function SitemapGeneratorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [activeTab, setActiveTab] = useState("table");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof SitemapPage; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPage, setSelectedPage] = useState<SitemapPage | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    relation: "Internal",
    fileTypes: ["HTML", "PDF"],
    domains: [],
    pathPrefix: "",
    includeRegex: "",
    excludeRegex: "",
    depth: [0, 10],
    scannedDateRange: ["", ""],
    lastModifiedRange: ["", ""],
    orphanCandidates: false
  });

  // Debounced search
  const [searchValue, setSearchValue] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchValue }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    const filtered = mockSitemapData.filter(page => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!page.url.toLowerCase().includes(searchLower) && 
            !(page.parentUrl?.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Relation filter
      if (filters.relation !== 'All' && page.relation !== filters.relation) {
        return false;
      }

      // File type filter
      if (filters.fileTypes.length > 0 && !filters.fileTypes.includes(page.fileType)) {
        return false;
      }

      // Domain filter
      if (filters.domains.length > 0 && !filters.domains.includes(page.domain)) {
        return false;
      }

      // Path prefix filter
      if (filters.pathPrefix && !page.url.includes(filters.pathPrefix)) {
        return false;
      }

      // Depth filter
      if (page.depth < filters.depth[0] || page.depth > filters.depth[1]) {
        return false;
      }

      // Orphan candidates filter
      if (filters.orphanCandidates && page.parentUrl) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal != null && bVal != null) {
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary calculation
  const summary = useMemo(() => {
    const internal = filteredData.filter(p => p.relation === 'Internal').length;
    const external = filteredData.filter(p => p.relation === 'External').length;
    const pdfs = filteredData.filter(p => p.isPdf).length;
    
    const fileTypes: { [key: string]: number } = {};
    filteredData.forEach(page => {
      fileTypes[page.fileType] = (fileTypes[page.fileType] || 0) + 1;
    });

    const domains: { [key: string]: number } = {};
    filteredData.forEach(page => {
      domains[page.domain] = (domains[page.domain] || 0) + 1;
    });

    return {
      totalPages: filteredData.length,
      internalPages: internal,
      externalPages: external,
      pdfCount: pdfs,
      pdfPercentage: filteredData.length > 0 ? (pdfs / filteredData.length) * 100 : 0,
      fileTypes,
      topDomains: Object.entries(domains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      maxDepth: Math.max(...filteredData.map(p => p.depth), 0)
    };
  }, [filteredData]);

  // Handlers
  const handleSort = (key: keyof SitemapPage) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(p => p.url)));
    }
  };

  const handleRowSelect = (url: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedRows(newSelected);
  };

  const handleExport = (format: 'CSV' | 'JSON') => {
    const data = selectedRows.size > 0 
      ? filteredData.filter(p => selectedRows.has(p.url))
      : filteredData;
    
    if (format === 'CSV') {
      const csv = [
        ['URL', 'Parent URL', 'Relation', 'Domain', 'File Type', 'Depth', 'Last Modified', 'Scanned At'],
        ...data.map(page => [
          page.url,
          page.parentUrl || '',
          page.relation,
          page.domain,
          page.fileType,
          page.depth.toString(),
          page.lastModified || '',
          page.scannedAt
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  const handleSendTo = (tool: 'Webpage Scan' | 'Readability' | 'WAVE') => {
    const urls = selectedRows.size > 0 
      ? Array.from(selectedRows)
      : filteredData.map(p => p.url);
    
    // Simulate API call
    console.log(`Sending ${urls.length} URLs to ${tool}`);
    // In real implementation, this would queue the jobs
  };

  const handleFilterChange = (key: keyof FilterState, value: string | number | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      relation: "Internal",
      fileTypes: ["HTML", "PDF"],
      domains: [],
      pathPrefix: "",
      includeRegex: "",
      excludeRegex: "",
      depth: [0, 10],
      scannedDateRange: ["", ""],
      lastModifiedRange: ["", ""],
      orphanCandidates: false
    });
    setSearchValue("");
    setCurrentPage(1);
  };

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
    return relation === 'Internal' ? <Home className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Sitemap Generator</h1>
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

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Crawl results from your subscription service, filtered and ready for export.</h2>
              </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
                      </Button>
            <Button variant="outline" size="sm" disabled={selectedRows.size === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send to...
                      </Button>
                </div>
              </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pages</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-2xl font-bold">{summary.totalPages.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">total pages</div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Internal vs External</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-2xl font-bold">{summary.internalPages}</div>
              <div className="text-sm text-muted-foreground">internal • {summary.externalPages} external</div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${summary.totalPages > 0 ? (summary.internalPages / summary.totalPages) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">PDFs</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="text-2xl font-bold">{summary.pdfCount}</div>
              <div className="text-sm text-muted-foreground">{summary.pdfPercentage.toFixed(1)}% of filtered set</div>
          </div>
        </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">File Types</CardTitle>
          </CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-1">
                {Object.entries(summary.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Domains</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-1">
                {summary.topDomains.slice(0, 3).map(({ domain, count }) => (
                  <div key={domain} className="flex justify-between text-sm">
                    <span className="truncate">{domain}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {summary.topDomains.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{summary.topDomains.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Rail */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              {showFilters && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search URLs..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Relation */}
                  <div className="space-y-2">
                    <Label>Relation</Label>
                    <div className="space-y-2">
                      {['All', 'Internal', 'External'].map((relation) => (
                        <div key={relation} className="flex items-center space-x-2">
                          <Checkbox
                            id={`relation-${relation}`}
                            checked={filters.relation === relation}
                            onCheckedChange={() => handleFilterChange('relation', relation)}
                          />
                          <Label htmlFor={`relation-${relation}`} className="text-sm">
                            {relation}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Types */}
                  <div className="space-y-2">
                    <Label>File Type</Label>
                    <div className="space-y-2">
                      {['HTML', 'PDF', 'CSS', 'JS'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filetype-${type}`}
                            checked={filters.fileTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleFilterChange('fileTypes', [...filters.fileTypes, type]);
                              } else {
                                handleFilterChange('fileTypes', filters.fileTypes.filter(t => t !== type));
                              }
                            }}
                          />
                          <Label htmlFor={`filetype-${type}`} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Path Prefix */}
                  <div className="space-y-2">
                    <Label htmlFor="pathPrefix">Path starts with</Label>
                    <Input
                      id="pathPrefix"
                      placeholder="/about"
                      value={filters.pathPrefix}
                      onChange={(e) => handleFilterChange('pathPrefix', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Start with a forward slash, for example /about</p>
                  </div>

                  {/* Include Regex */}
                  <div className="space-y-2">
                    <Label htmlFor="includeRegex">Include regex</Label>
                    <Input
                      id="includeRegex"
                      placeholder="Pattern..."
                      value={filters.includeRegex}
                      onChange={(e) => handleFilterChange('includeRegex', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Patterns run on the server, complex searches time out.</p>
                  </div>

                  {/* Exclude Regex */}
                  <div className="space-y-2">
                    <Label htmlFor="excludeRegex">Exclude regex</Label>
                    <Input
                      id="excludeRegex"
                      placeholder="Pattern..."
                      value={filters.excludeRegex}
                      onChange={(e) => handleFilterChange('excludeRegex', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Patterns run on the server, complex searches time out.</p>
                  </div>

                  {/* Depth */}
                  <div className="space-y-2">
                    <Label>Depth: {filters.depth[0]} - {filters.depth[1]}</Label>
                    <Slider
                      value={filters.depth}
                      onValueChange={(value) => handleFilterChange('depth', value[0])}
                      max={summary.maxDepth}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Orphan Candidates */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="orphanCandidates"
                        checked={filters.orphanCandidates}
                        onCheckedChange={(checked) => handleFilterChange('orphanCandidates', checked.toString())}
                      />
                      <Label htmlFor="orphanCandidates" className="text-sm">
                        Orphan candidates
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Items without a known parent link in this crawl.</p>
                  </div>

                  {/* Clear All */}
                  <div className="pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full">
                      Clear all filters
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {filteredData.length} results
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Content Tabs */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>

              <TabsContent value="structure" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Site Structure</CardTitle>
                    <CardDescription>
                      Interactive tree view of your site structure
                    </CardDescription>
                  </CardHeader>
                  <div className="p-6 pt-0">
                    <div className="space-y-2">
                      {filteredData
                        .filter(page => page.depth === 0)
                        .map(page => (
                          <div key={page.url} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                            <Folder className="h-4 w-4" />
                            <span className="text-sm">{page.title || page.url}</span>
                            <Badge variant="outline" className="text-xs">
                              {page.fileType}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </Card>
          </TabsContent>

              <TabsContent value="table" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Sitemap Data</CardTitle>
                        <CardDescription>
                          {selectedRows.size > 0 && `${selectedRows.size} selected • `}
                          {filteredData.length} total pages
                        </CardDescription>
                      </div>
                      {selectedRows.size > 0 && (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExport('JSON')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export JSON
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <div className="p-6 pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">
                              <Checkbox
                                checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('url')}
                            >
                              URL
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('relation')}
                            >
                              Relation
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('depth')}
                            >
                              Depth
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('domain')}
                            >
                              Domain
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('fileType')}
                            >
                              File Type
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('lastModified')}
                            >
                              Last Modified
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('scannedAt')}
                            >
                              Scanned At
                            </th>
                            <th className="text-left py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((page) => (
                            <tr key={page.url} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <Checkbox
                                  checked={selectedRows.has(page.url)}
                                  onCheckedChange={() => handleRowSelect(page.url)}
                                />
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex items-center space-x-2">
                                  <span className="truncate">{page.url}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(page.url)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  {getRelationIcon(page.relation)}
                                  {page.relation}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">{page.depth}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">{page.domain}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className={getFileTypeColor(page.fileType)}>
                                  {page.fileType}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">
                                  {page.lastModified 
                                    ? new Date(page.lastModified).toLocaleDateString()
                                    : '—'
                                  }
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm">
                                  {new Date(page.scannedAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedPage(page)}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SitemapGeneratorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SitemapGeneratorPageContent />
    </Suspense>
  );
}