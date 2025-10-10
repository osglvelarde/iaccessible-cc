import { useState, useEffect } from 'react';
import { Plus, Filter, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportCard } from './ReportCard';
import { CreateReportWizard } from '../reports/CreateReportWizard';
import type { Report } from '@/types';

interface DashboardProps {
  onReportSelect: (reportId: string) => void;
}

export const Dashboard = ({ onReportSelect, onReportComplete }: DashboardProps & { onReportComplete: (id: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Use any[] to allow enhanced report properties
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    // Fetch reports and findings, then calculate progress
    async function fetchReportsAndFindings() {
      try {
        const [reportsRes, findingsRes] = await Promise.all([
          fetch('http://localhost:3001/reports'),
          fetch('http://localhost:3001/findings')
        ]);
        if (!reportsRes.ok || !findingsRes.ok) {
          throw new Error('Failed to fetch reports or findings');
        }
        const reportsData = await reportsRes.json();
        const findingsData = await findingsRes.json();

        // Calculate progress for each report
        const enhancedReports = reportsData.map((report: any) => {
          const findingsForReport = findingsData.filter((f: any) => f.reportId === report.id);
          const completed = findingsForReport.filter((f: any) => f.status === 'Pass' || f.status === 'Fail').length;
          // For demo, assume 50 criteria per report (replace with real count if available)
          const total = 50;
          const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            ...report,
            progressPercent,
            criticalIssues: findingsForReport.filter((f: any) => f.severity === 'Critical').length,
            majorIssues: findingsForReport.filter((f: any) => f.severity === 'Major').length,
            minorIssues: findingsForReport.filter((f: any) => f.severity === 'Minor').length,
          };
        });
        setReports(enhancedReports);
      } catch (error) {
        console.error(error);
        setReports([]);
      }
    }
    fetchReportsAndFindings();
  }, []);

  // Helper to get due date status
  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return 'none';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'approaching';
    return 'ontrack';
  };

  const filteredReports = reports.filter(report => {
    const search = searchTerm.toLowerCase();
    const matchesTitle = report.title?.toLowerCase().includes(search);
    const matchesClient = report.client?.toLowerCase().includes(search);
    const matchesTags = Array.isArray(report.tags)
      ? report.tags.some((tag: string) => tag.toLowerCase().includes(search))
      : false;
    const matchesSearch = matchesTitle || matchesClient || matchesTags;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesClientFilter = clientFilter === 'all' || report.client === clientFilter;
    const dueStatus = getDueDateStatus(report.dueDate);
    const matchesDueDateFilter =
      dueDateFilter === 'all' ||
      (dueDateFilter === 'ontrack' && dueStatus === 'ontrack') ||
      (dueDateFilter === 'approaching' && dueStatus === 'approaching') ||
      (dueDateFilter === 'overdue' && (dueStatus === 'overdue' || dueStatus === 'today'));
    const matchesTagFilter =
      selectedTags.length === 0 ||
      (Array.isArray(report.tags) && selectedTags.every(tag =>
        report.tags.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())
      ));
    return matchesSearch && matchesStatus && matchesClientFilter && matchesDueDateFilter && matchesTagFilter;
  });

  if (showCreateWizard) {
    return (
      <CreateReportWizard
        onComplete={(newReportId) => {
          setShowCreateWizard(false);
          // Notify parent component of new report creation
          onReportComplete(newReportId);
        }}
        onCancel={() => setShowCreateWizard(false)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Accessibility Reports Dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" tabIndex={0}>
            Accessibility Reports
          </h1>
          <p className="text-muted-foreground mt-1" tabIndex={0}>
            Manage and track your WCAG compliance audits
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="View analytics dashboard"
          >
            <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
            Analytics
          </Button>
          <Button
            onClick={() => setShowCreateWizard(true)}
            size="sm"
            className="gap-2"
            aria-label="Create new accessibility report"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Multi-select tag filter */}
      <div className="mb-2 flex flex-wrap gap-2">
        {Array.from(new Set(reports.flatMap((r: any) => Array.isArray(r.tags) ? r.tags : []))).map((tag: string) => (
          <label key={tag} className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => {
                setSelectedTags(selectedTags.includes(tag)
                  ? selectedTags.filter(t => t !== tag)
                  : [...selectedTags, tag]);
              }}
            />
            <span className="rounded bg-muted px-2 py-0.5">{tag}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search reports by title, client, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search reports"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Released">Released</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {[...new Set(reports.map((r: any) => r.client).filter(Boolean))].map((client: string) => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by due date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Due Dates</SelectItem>
              <SelectItem value="ontrack">On Track ({">"}7 days)</SelectItem>
              <SelectItem value="approaching">Approaching ({"≤"}7 days)</SelectItem>
              <SelectItem value="overdue">Overdue/Today</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            More Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' ? 
              'No reports match your search criteria.' : 
              'No reports found. Create your first accessibility audit report to get started.'
            }
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateWizard(true)}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Create Your First Report
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onSelect={onReportSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
