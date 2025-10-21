import { dataScopingManager, getUserDataScope } from './data-scoping';
import { UserWithDetails } from './types/users-roles';

// Example report data structure
export interface Report {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  operatingUnitId: string;
  type: 'accessibility' | 'compliance' | 'performance' | 'custom';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  format: 'pdf' | 'excel' | 'csv' | 'html';
  data: any;
  generatedAt?: string;
  expiresAt?: string;
  isScheduled: boolean;
  scheduleConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  fileSize?: number;
  downloadCount: number;
}

export interface ReportFilters {
  organizationId?: string;
  operatingUnitId?: string;
  type?: string;
  status?: string;
  format?: string;
  isScheduled?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mock reports data
const MOCK_REPORTS: Report[] = [
  {
    id: 'report-1',
    name: 'Monthly Accessibility Report',
    description: 'Comprehensive accessibility compliance report for January 2024',
    organizationId: 'org-1',
    operatingUnitId: 'ou-1',
    type: 'accessibility',
    status: 'completed',
    format: 'pdf',
    data: { scans: 45, issues: 12, score: 85 },
    generatedAt: '2024-01-31T23:59:59Z',
    expiresAt: '2024-02-28T23:59:59Z',
    isScheduled: true,
    scheduleConfig: {
      frequency: 'monthly',
      dayOfMonth: 31,
      time: '23:59'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-31T23:59:59Z',
    createdBy: 'user-1',
    fileSize: 2048576,
    downloadCount: 15
  },
  {
    id: 'report-2',
    name: 'Weekly Scan Summary',
    description: 'Weekly summary of all accessibility scans',
    organizationId: 'org-1',
    operatingUnitId: 'ou-2',
    type: 'performance',
    status: 'generating',
    format: 'excel',
    data: null,
    isScheduled: true,
    scheduleConfig: {
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00'
    },
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    createdBy: 'user-2',
    downloadCount: 0
  },
  {
    id: 'report-3',
    name: 'Compliance Audit Report',
    description: 'Detailed compliance audit for regulatory requirements',
    organizationId: 'org-2',
    operatingUnitId: 'ou-3',
    type: 'compliance',
    status: 'draft',
    format: 'pdf',
    data: null,
    isScheduled: false,
    createdAt: '2024-01-17T14:00:00Z',
    updatedAt: '2024-01-17T14:00:00Z',
    createdBy: 'user-3',
    downloadCount: 0
  }
];

// API functions with data scoping
export async function getReports(
  filters: ReportFilters = {},
  user: UserWithDetails
): Promise<ReportsResponse> {
  // Apply data scoping to filter reports based on user's access
  const accessibleReports = dataScopingManager.filterReports(MOCK_REPORTS, user);
  
  // Apply additional filters
  let filteredReports = accessibleReports;
  
  if (filters.type) {
    filteredReports = filteredReports.filter(report => report.type === filters.type);
  }
  
  if (filters.status) {
    filteredReports = filteredReports.filter(report => report.status === filters.status);
  }
  
  if (filters.format) {
    filteredReports = filteredReports.filter(report => report.format === filters.format);
  }
  
  if (filters.isScheduled !== undefined) {
    filteredReports = filteredReports.filter(report => report.isScheduled === filters.isScheduled);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredReports = filteredReports.filter(report => 
      report.name.toLowerCase().includes(searchLower) ||
      (report.description && report.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const total = filteredReports.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);
  
  return {
    reports: paginatedReports,
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getReportById(reportId: string, user: UserWithDetails): Promise<Report | null> {
  const report = MOCK_REPORTS.find(r => r.id === reportId);
  
  if (!report) {
    return null;
  }
  
  // Check if user has access to this report
  const hasAccess = dataScopingManager.validateDataAccess(user, report);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  return report;
}

export async function createReport(
  reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>,
  user: UserWithDetails
): Promise<Report> {
  // Validate user has access to the target organization and OU
  const hasAccess = dataScopingManager.validateDataAccess(user, {
    organizationId: reportData.organizationId,
    operatingUnitId: reportData.operatingUnitId
  });
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  const newReport: Report = {
    ...reportData,
    id: `report-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    downloadCount: 0
  };
  
  // In a real implementation, this would save to database
  MOCK_REPORTS.push(newReport);
  
  return newReport;
}

export async function updateReport(
  reportId: string,
  updates: Partial<Report>,
  user: UserWithDetails
): Promise<Report> {
  const report = MOCK_REPORTS.find(r => r.id === reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Validate user has access to this report
  const hasAccess = dataScopingManager.validateDataAccess(user, report);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Update report
  Object.assign(report, updates, { updatedAt: new Date().toISOString() });
  
  return report;
}

export async function deleteReport(reportId: string, user: UserWithDetails): Promise<boolean> {
  const reportIndex = MOCK_REPORTS.findIndex(r => r.id === reportId);
  
  if (reportIndex === -1) {
    throw new Error('Report not found');
  }
  
  const report = MOCK_REPORTS[reportIndex];
  
  // Validate user has access to this report
  const hasAccess = dataScopingManager.validateDataAccess(user, report);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Delete report
  MOCK_REPORTS.splice(reportIndex, 1);
  
  return true;
}

export async function generateReport(
  reportId: string,
  user: UserWithDetails
): Promise<Report> {
  const report = MOCK_REPORTS.find(r => r.id === reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Validate user has access to this report
  const hasAccess = dataScopingManager.validateDataAccess(user, report);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Simulate report generation
  report.status = 'generating';
  report.updatedAt = new Date().toISOString();
  
  // In a real implementation, this would trigger an async job
  setTimeout(() => {
    report.status = 'completed';
    report.generatedAt = new Date().toISOString();
    report.data = { generated: true, timestamp: new Date().toISOString() };
    report.fileSize = Math.floor(Math.random() * 5000000) + 1000000; // Random file size
  }, 5000);
  
  return report;
}

export async function downloadReport(
  reportId: string,
  user: UserWithDetails
): Promise<{ url: string; filename: string }> {
  const report = MOCK_REPORTS.find(r => r.id === reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Validate user has access to this report
  const hasAccess = dataScopingManager.validateDataAccess(user, report);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  if (report.status !== 'completed') {
    throw new Error('Report is not ready for download');
  }
  
  // Increment download count
  report.downloadCount++;
  report.updatedAt = new Date().toISOString();
  
  // In a real implementation, this would generate a signed URL
  const filename = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.${report.format}`;
  const url = `/api/reports/${reportId}/download?token=${Date.now()}`;
  
  return { url, filename };
}

// Utility function to get report statistics
export async function getReportStatistics(
  user: UserWithDetails,
  organizationId?: string,
  operatingUnitId?: string
): Promise<{
  totalReports: number;
  completedReports: number;
  generatingReports: number;
  draftReports: number;
  scheduledReports: number;
  totalDownloads: number;
  averageFileSize: number;
}> {
  // Get accessible reports
  let accessibleReports = dataScopingManager.filterReports(MOCK_REPORTS, user);
  
  // Apply additional filters if provided
  if (organizationId) {
    accessibleReports = accessibleReports.filter(report => report.organizationId === organizationId);
  }
  
  if (operatingUnitId) {
    accessibleReports = accessibleReports.filter(report => report.operatingUnitId === operatingUnitId);
  }
  
  const totalReports = accessibleReports.length;
  const completedReports = accessibleReports.filter(report => report.status === 'completed').length;
  const generatingReports = accessibleReports.filter(report => report.status === 'generating').length;
  const draftReports = accessibleReports.filter(report => report.status === 'draft').length;
  const scheduledReports = accessibleReports.filter(report => report.isScheduled).length;
  const totalDownloads = accessibleReports.reduce((sum, report) => sum + report.downloadCount, 0);
  
  // Calculate average file size for completed reports
  const completedWithSize = accessibleReports.filter(report => 
    report.status === 'completed' && report.fileSize
  );
  const averageFileSize = completedWithSize.length > 0
    ? completedWithSize.reduce((sum, report) => sum + (report.fileSize || 0), 0) / completedWithSize.length
    : 0;
  
  return {
    totalReports,
    completedReports,
    generatingReports,
    draftReports,
    scheduledReports,
    totalDownloads,
    averageFileSize
  };
}

// Function to get scheduled reports that need to be generated
export async function getScheduledReportsToGenerate(): Promise<Report[]> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentDate = now.getDate();
  
  return MOCK_REPORTS.filter(report => {
    if (!report.isScheduled || !report.scheduleConfig) {
      return false;
    }
    
    const { frequency, dayOfWeek, dayOfMonth, time } = report.scheduleConfig;
    const [scheduleHour] = time.split(':').map(Number);
    
    switch (frequency) {
      case 'daily':
        return currentHour === scheduleHour;
      case 'weekly':
        return currentDay === dayOfWeek && currentHour === scheduleHour;
      case 'monthly':
        return currentDate === dayOfMonth && currentHour === scheduleHour;
      default:
        return false;
    }
  });
}
