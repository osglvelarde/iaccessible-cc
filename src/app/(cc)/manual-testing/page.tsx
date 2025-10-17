'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, ExternalLink, Calendar, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseCrawledPages, getUniqueDepartments, getUniqueOrganizations, filterPages, CrawledPage } from '@/lib/csv-parser';
import { TestSessionSummary, getTestStatusFromSessionSummary, formatDate } from '@/lib/manual-testing';
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
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [internalExternal, setInternalExternal] = useState<'Internal' | 'External' | 'All'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Get unique values for filters
  const departments = getUniqueDepartments(pages);
  const organizations = getUniqueOrganizations(pages);

  const loadTestSessions = async () => {
    try {
      const response = await fetch('/api/manual-testing/sessions', { method: 'PUT' });
      if (response.ok) {
        const sessions = await response.json();
        setTestSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading test sessions:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pages from CSV
      const crawledPages = await parseCrawledPages();
      setPages(crawledPages);
      
      // Load existing test sessions
      await loadTestSessions();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    const filtered = filterPages(pages, {
      search: searchTerm,
      department: selectedDepartment || undefined,
      organization: selectedOrganization || undefined,
      internalExternal: internalExternal === 'All' ? undefined : internalExternal,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    });
    setFilteredPages(filtered);
  };
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    applyFilters();
  }, [applyFilters, pages, searchTerm, selectedDepartment, selectedOrganization, internalExternal, dateFrom, dateTo]);

  const getTestSessionForPage = (pageUrl: string): TestSessionSummary | null => {
    return testSessions.find(session => session.pageUrl === pageUrl) || null;
  };

  const getTestStatusBadge = (pageUrl: string) => {
    const session = getTestSessionForPage(pageUrl);
    if (!session) {
      return <Badge variant="outline">Not Started</Badge>;
    }
    
    const status = getTestStatusFromSessionSummary(session);
    switch (status) {
      case 'In Progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedOrganization('');
    setInternalExternal('All');
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pages...</p>
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
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
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
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by URL, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment || "all"} onValueChange={(value) => setSelectedDepartment(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <Select value={selectedOrganization || "all"} onValueChange={(value) => setSelectedOrganization(value === "all" ? "" : value)}>
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
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <p className="text-sm text-muted-foreground">
              Showing {filteredPages.length} of {pages.length} pages
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page) => {
          const session = getTestSessionForPage(page.webpage);
          return (
            <Card key={page.webpage} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {page.webpage}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getTestStatusBadge(page.webpage)}
                      <Badge variant="outline" className="text-xs">
                        {page.internalExternal}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{page.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{page.organizationName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Scanned:</span>
                    <span className="font-medium">{page.dateScanned}</span>
                  </div>
                </div>

                {session && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      <div>Progress: {session.progressPercent}%</div>
                      <div>Last updated: {formatDate(session.lastUpdatedAt)}</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/manual-testing/${session?.testId || 'new'}?url=${encodeURIComponent(page.webpage)}`}>
                      {session ? 'Continue Test' : 'Start New Test'}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={page.webpage} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPages.length === 0 && (
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
