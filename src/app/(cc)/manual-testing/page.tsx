'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Plus, ExternalLink, Calendar, Building2, Users, CheckCircle, Clock, AlertCircle, Grid3X3, Table2, Settings, Eye, Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseCrawledPages, getUniqueDepartments, getUniqueOperatingUnits, getUniqueOrganizations, filterPages, CrawledPage } from '@/lib/csv-parser';
import { TestSessionSummary, TestSession, getTestStatusFromSessionSummary, formatDate, calculateSessionSummary } from '@/lib/manual-testing';
import { getCriteriaForVersionAndLevel } from '@/lib/wcag-complete';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ManualTestingDashboardProps {}

export default function ManualTestingDashboard({}: ManualTestingDashboardProps) {
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<CrawledPage[]>([]);
  const [testSessions, setTestSessions] = useState<TestSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedOperatingUnit, setSelectedOperatingUnit] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [internalExternal, setInternalExternal] = useState<'Internal' | 'External' | 'All'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'url' | 'organization' | 'operatingUnit' | 'dateScanned' | 'status'>('url');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showInProgressOnly, setShowInProgressOnly] = useState(true);
  
  // Get unique values for filters
  const departments = useMemo(() => getUniqueDepartments(pages), [pages]);
  const operatingUnits = useMemo(() => getUniqueOperatingUnits(pages), [pages]);
  const organizations = useMemo(() => getUniqueOrganizations(pages), [pages]);
  
  // Get operating units filtered by selected organization
  const filteredOperatingUnits = useMemo(() => {
    if (!selectedOrganization) return operatingUnits;
    
    return operatingUnits.filter(ou => {
      const pagesWithOU = pages.filter(p => p.operatingUnitName === ou);
      return pagesWithOU.some(p => p.organizationName === selectedOrganization);
    });
  }, [selectedOrganization, operatingUnits, pages]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedOperatingUnit, selectedOrganization, internalExternal, dateFrom, dateTo, sortBy, showInProgressOnly]);

  const getTestSessionForPage = (pageUrl: string): TestSessionSummary | null => {
    return testSessions.find(session => session.pageUrl === pageUrl) || null;
  };

  const loadTestSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/manual-testing/sessions', { method: 'PUT' });
      if (response.ok) {
        const sessions: TestSession[] = await response.json();
        // Convert TestSession to TestSessionSummary with proper progress calculation
        const sessionSummaries = sessions.map(session => {
          // Get the total criteria count based on WCAG version and level
          const criteria = getCriteriaForVersionAndLevel(session.wcagVersion, session.level);
          return calculateSessionSummary(session, criteria.length);
        });
        setTestSessions(sessionSummaries);
      }
    } catch (error) {
      console.error('Error loading test sessions:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load pages from CSV
      try {
        const crawledPages = await parseCrawledPages();
        setPages(crawledPages);
      } catch (csvError) {
        console.error('Error loading CSV data:', csvError);
        // Set empty pages array if CSV fails to load
        setPages([]);
      }
      
      // Load existing test sessions
      await loadTestSessions();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadTestSessions]);
  
  const applyFilters = useCallback(() => {
    let filtered = filterPages(pages, {
      search: searchTerm,
      department: selectedDepartment || undefined,
      operatingUnit: selectedOperatingUnit || undefined,
      organization: selectedOrganization || undefined,
      internalExternal: internalExternal === 'All' ? undefined : internalExternal,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    });

    // Filter by in-progress status if enabled
    if (showInProgressOnly) {
      filtered = filtered.filter(page => {
        const session = testSessions.find(s => s.pageUrl === page.webpage);
        const status = session ? getTestStatusFromSessionSummary(session) : 'Not Started';
        return status === 'In Progress';
      });
    }
    
    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'url':
          return a.webpage.localeCompare(b.webpage);
        case 'organization':
          return a.organizationName.localeCompare(b.organizationName);
        case 'operatingUnit':
          return a.operatingUnitName.localeCompare(b.operatingUnitName);
        case 'dateScanned':
          return new Date(b.dateScanned).getTime() - new Date(a.dateScanned).getTime();
        case 'status':
          const aSession = testSessions.find(session => session.pageUrl === a.webpage);
          const bSession = testSessions.find(session => session.pageUrl === b.webpage);
          const aStatus = aSession ? getTestStatusFromSessionSummary(aSession) : 'Not Started';
          const bStatus = bSession ? getTestStatusFromSessionSummary(bSession) : 'Not Started';
          const statusOrder = { 'Completed': 0, 'In Progress': 1, 'Not Started': 2 };
          return statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder];
        default:
          return 0;
      }
    });
    
    setFilteredPages(sorted);
  }, [pages, searchTerm, selectedDepartment, selectedOperatingUnit, selectedOrganization, internalExternal, dateFrom, dateTo, sortBy, testSessions, showInProgressOnly]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getTestStatusBadge = (pageUrl: string) => {
    const session = getTestSessionForPage(pageUrl);
    if (!session) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Not Started
        </Badge>
      );
    }
    
    const status = getTestStatusFromSessionSummary(session);
    switch (status) {
      case 'In Progress':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'Completed':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Started
          </Badge>
        );
    }
  };

  const handleOrganizationChange = useCallback((value: string) => {
    const newOrg = value === "all" ? "" : value;
    setSelectedOrganization(newOrg);
    // Clear operating unit when organization changes
    if (newOrg !== "") {
      setSelectedOperatingUnit('');
    }
  }, []);

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, []);

  const formatUrl = useCallback((url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname + urlObj.search + urlObj.hash;
      
      if (domain.length + 10 > maxLength) {
        return `${domain.substring(0, maxLength - 10)}...`;
      }
      
      const remainingLength = maxLength - domain.length - 3;
      if (path.length > remainingLength) {
        return `${domain}${path.substring(0, remainingLength)}...`;
      }
      
      return `${domain}${path}`;
    } catch {
      return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
    }
  }, []);

  const parseUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        path: urlObj.pathname + urlObj.search + urlObj.hash,
        protocol: urlObj.protocol
      };
    } catch {
      return {
        domain: url.split('/')[2] || url,
        path: url.split('/').slice(3).join('/') || '',
        protocol: 'https:'
      };
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedOperatingUnit('');
    setSelectedOrganization('');
    setInternalExternal('All');
    setDateFrom('');
    setDateTo('');
    setSortBy('url');
    setShowInProgressOnly(true); // Reset to default in-progress filter
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Summary Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-16" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pages Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manual Testing Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Select pages from crawled data to conduct WCAG accessibility tests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                >
                  {viewMode === 'table' ? <Grid3X3 className="h-4 w-4 mr-2" /> : <Table2 className="h-4 w-4 mr-2" />}
                  {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to {viewMode === 'table' ? 'grid' : 'table'} view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
            Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Filter Pages</SheetTitle>
                <SheetDescription>
                  Use the filters below to narrow down the pages you want to test.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* Mobile Filters Content - Same as desktop but in sheet */}
                <div className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                        placeholder="Search by URL, operating unit, organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

                  {/* Operating Unit */}
            <div className="space-y-2">
                    <label className="text-sm font-medium">Operating Unit</label>
                    <Select value={selectedOperatingUnit || "all"} onValueChange={(value) => setSelectedOperatingUnit(value === "all" ? "" : value)}>
                <SelectTrigger>
                        <SelectValue placeholder="All operating units" />
                </SelectTrigger>
                <SelectContent>
                        <SelectItem value="all">All operating units</SelectItem>
                        {filteredOperatingUnits.map(ou => (
                          <SelectItem key={ou} value={ou}>{ou}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
                    <Select value={selectedOrganization || "all"} onValueChange={handleOrganizationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizations</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Internal/External */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={internalExternal} onValueChange={(value) => setInternalExternal(value as 'All' | 'Internal' | 'External')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="operatingUnit">Operating Unit</SelectItem>
                        <SelectItem value="dateScanned">Date Scanned</SelectItem>
                        <SelectItem value="status">Test Status</SelectItem>
                      </SelectContent>
                    </Select>
            </div>
          </div>

                <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
                  <Button onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{pages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Operating Units</p>
                <p className="text-2xl font-bold">{operatingUnits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tests In Progress</p>
                <p className="text-2xl font-bold">
                  {testSessions.filter(s => getTestStatusFromSessionSummary(s) === 'In Progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Completed Tests</p>
                <p className="text-2xl font-bold">
                  {testSessions.filter(s => getTestStatusFromSessionSummary(s) === 'Completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search - Full width on mobile, 1/3 on desktop */}
            <div className="flex-1 lg:max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Row 1 */}
            <div className="flex flex-wrap gap-3">
              {/* Operating Unit */}
              <div className="min-w-[140px]">
                <Select value={selectedOperatingUnit || "all"} onValueChange={(value) => setSelectedOperatingUnit(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Operating Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All OUs</SelectItem>
                    {filteredOperatingUnits.map(ou => (
                      <SelectItem key={ou} value={ou}>{ou}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Organization */}
              <div className="min-w-[140px]">
                <Select value={selectedOrganization || "all"} onValueChange={handleOrganizationChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orgs</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org} value={org}>{org}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="min-w-[100px]">
                <Select value={internalExternal} onValueChange={(value) => setInternalExternal(value as 'All' | 'Internal' | 'External')}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="min-w-[120px]">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="operatingUnit">Operating Unit</SelectItem>
                    <SelectItem value="dateScanned">Date Scanned</SelectItem>
                    <SelectItem value="status">Test Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Row 2 - Date Range */}
            <div className="flex gap-3">
              <div className="min-w-[120px]">
                <Input
                  type="date"
                  placeholder="From"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="min-w-[120px]">
                <Input
                  type="date"
                  placeholder="To"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {viewMode === 'table' && (
                <Button
                  variant={showInProgressOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowInProgressOnly(!showInProgressOnly);
                    setCurrentPage(1);
                  }}
                  className="h-9"
                >
                  In Progress Only
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
                Clear
              </Button>
              {viewMode === 'table' && (
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Filter Status and Results */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredPages.length} of {pages.length} pages</span>
              {(selectedOrganization || selectedOperatingUnit || internalExternal !== 'All' || showInProgressOnly) && (
                <span className="text-muted-foreground">•</span>
              )}
              {showInProgressOnly && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  In Progress Only
                </Badge>
              )}
              {selectedOrganization && (
                <Badge variant="outline" className="text-xs">
                  {selectedOrganization}
                </Badge>
              )}
              {selectedOperatingUnit && (
                <Badge variant="outline" className="text-xs">
                  {selectedOperatingUnit}
                </Badge>
              )}
              {internalExternal !== 'All' && (
                <Badge variant="outline" className="text-xs">
                  {internalExternal}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Sorted by {sortBy === 'url' ? 'URL' : sortBy === 'operatingUnit' ? 'Operating Unit' : sortBy === 'dateScanned' ? 'Date Scanned' : sortBy === 'status' ? 'Test Status' : 'Organization'}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Pages Content */}
      {viewMode === 'table' ? (
        <div className="space-y-4">
          <Card>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Operating Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Scanned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPages.map((page) => {
                    const session = getTestSessionForPage(page.webpage);
                    const status = session ? getTestStatusFromSessionSummary(session) : 'Not Started';
                    const isInProgress = status === 'In Progress';
                    return (
                      <TableRow 
                        key={page.webpage} 
                        className={isInProgress ? 'bg-blue-50/50 hover:bg-blue-100/50 border-l-4 border-l-blue-400' : ''}
                      >
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className="truncate cursor-pointer group hover:text-primary transition-colors"
                                    onClick={() => copyToClipboard(page.webpage)}
                                  >
                                    {formatUrl(page.webpage, 40)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <div className="space-y-2">
                                    <p className="font-medium">Full URL:</p>
                                    <p className="text-xs break-all">{page.webpage}</p>
                                    <div className="pt-2 border-t">
                                      <p className="text-xs text-muted-foreground">
                                        {copiedUrl === page.webpage ? (
                                          <span className="flex items-center gap-1 text-green-600">
                                            <Check className="h-3 w-3" />
                                            Copied!
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <Copy className="h-3 w-3" />
                                            Click to copy
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(page.webpage)}
                            >
                              {copiedUrl === page.webpage ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{page.organizationName}</TableCell>
                        <TableCell>{page.operatingUnitName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {page.internalExternal}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTestStatusBadge(page.webpage)}</TableCell>
                        <TableCell>
                          {session ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${session.progressPercent}%` }}
                                />
                              </div>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span className="font-medium">{session.completedCriteria}/{session.totalCriteria}</span>
                                <span>{session.progressPercent}%</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {page.dateScanned}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button asChild size="sm">
                              <Link href={`/manual-testing/${session?.testId || 'new'}?url=${encodeURIComponent(page.webpage)}`}>
                                {session ? 'Continue' : 'Start'}
                              </Link>
                            </Button>
                            {session && session.completedCriteria > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/manual-testing/${session.testId}?url=${encodeURIComponent(page.webpage)}&view=report`}>
                                        <FileText className="h-3 w-3" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Report</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={page.webpage} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open page in new tab</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredPages.length)} of {filteredPages.length} pages
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {(() => {
                    const pageNumbers = [];
                    const maxVisible = Math.min(5, totalPages);
                    
                    if (totalPages <= 5) {
                      // Show all pages if 5 or fewer
                      for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(i);
                      }
                    } else if (currentPage <= 3) {
                      // Show first 5 pages
                      for (let i = 1; i <= 5; i++) {
                        pageNumbers.push(i);
                      }
                    } else if (currentPage >= totalPages - 2) {
                      // Show last 5 pages
                      for (let i = totalPages - 4; i <= totalPages; i++) {
                        pageNumbers.push(i);
                      }
                    } else {
                      // Show current page with 2 pages before and after
                      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                        pageNumbers.push(i);
                      }
                    }
                    
                    return pageNumbers.map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    ));
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page) => {
          const session = getTestSessionForPage(page.webpage);
          return (
              <Card key={page.webpage} className="hover:shadow-md transition-shadow h-fit min-h-[200px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="cursor-pointer group"
                                  onClick={() => copyToClipboard(page.webpage)}
                                >
                                  <div className="space-y-1">
                                    <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                                      {(() => {
                                        const { domain, path } = parseUrl(page.webpage);
                                        return (
                                          <div>
                                            <div className="font-semibold text-foreground truncate">
                                              {domain}
                                            </div>
                                            {path && (
                                              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                <span>{path.length > 30 ? `${path.substring(0, 30)}...` : path}</span>
                                                {path.length > 30 && (
                                                  <span className="text-xs text-muted-foreground/60">
                                                    ({path.length} chars)
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                    </CardTitle>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <div className="space-y-2">
                                  <p className="font-medium">Full URL:</p>
                                  <p className="text-xs break-all">{page.webpage}</p>
                                  <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">
                                      {copiedUrl === page.webpage ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                          <Check className="h-3 w-3" />
                                          Copied to clipboard!
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <Copy className="h-3 w-3" />
                                          Click to copy URL
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(page.webpage)}
                        >
                          {copiedUrl === page.webpage ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                      {getTestStatusBadge(page.webpage)}
                      <Badge variant="outline" className="text-xs">
                        {page.internalExternal}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{page.organizationName}</span>
                  </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Operating Unit:</span>
                      <span className="font-medium">{page.operatingUnitName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Scanned:</span>
                    <span className="font-medium">{page.dateScanned}</span>
                  </div>
                </div>

                {session && (
                  <div className="pt-2 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{session.completedCriteria}/{session.totalCriteria}</span>
                            <span className="text-muted-foreground">{session.progressPercent}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${session.progressPercent}%` }}
                          />
                        </div>
                    <div className="text-xs text-muted-foreground">
                          Last updated: {formatDate(session.lastUpdatedAt)}
                        </div>
                    </div>
                  </div>
                )}

                  <div className="flex gap-2 pt-2 mt-auto">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/manual-testing/${session?.testId || 'new'}?url=${encodeURIComponent(page.webpage)}`}>
                      {session ? 'Continue Test' : 'Start New Test'}
                    </Link>
                  </Button>
                  {session && session.completedCriteria > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/manual-testing/${session.testId}?url=${encodeURIComponent(page.webpage)}&view=report`}>
                        <FileText className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Page Details</DialogTitle>
                          <DialogDescription>
                            Detailed information about this page and its testing status.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">URL</h4>
                            <p className="text-sm text-muted-foreground break-all">{page.webpage}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium">Organization</h4>
                              <p className="text-sm text-muted-foreground">{page.organizationName}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium">Operating Unit</h4>
                              <p className="text-sm text-muted-foreground">{page.operatingUnitName}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium">Type</h4>
                              <Badge variant="outline">{page.internalExternal}</Badge>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium">Scanned</h4>
                              <p className="text-sm text-muted-foreground">{page.dateScanned}</p>
                            </div>
                          </div>
                          {session && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Test Progress</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Progress</span>
                                  <div className="flex flex-col items-end">
                                    <span className="font-medium">{session.completedCriteria}/{session.totalCriteria}</span>
                                    <span className="text-muted-foreground text-xs">{session.progressPercent}%</span>
                                  </div>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${session.progressPercent}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Last updated: {formatDate(session.lastUpdatedAt)}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 pt-4">
                            <Button asChild className="flex-1">
                              <Link href={`/manual-testing/${session?.testId || 'new'}?url=${encodeURIComponent(page.webpage)}`}>
                                {session ? 'Continue Test' : 'Start New Test'}
                              </Link>
                            </Button>
                            {session && session.completedCriteria > 0 && (
                              <Button variant="outline" asChild>
                                <Link href={`/manual-testing/${session.testId}?url=${encodeURIComponent(page.webpage)}&view=report`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Report
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" asChild>
                              <a href={page.webpage} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Page
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" asChild>
                    <a href={page.webpage} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open page in new tab</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {filteredPages.length === 0 && pages.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No pages available. The CSV file may not be accessible or may be empty.
            </p>
            <Button variant="outline" onClick={loadData} className="mt-4">
              Retry Loading Data
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredPages.length === 0 && pages.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No pages match your current filters. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
