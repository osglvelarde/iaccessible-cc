import { dataScopingManager, getUserDataScope } from './data-scoping';
import { UserWithDetails } from './types/users-roles';

// Example scan data structure
export interface Scan {
  id: string;
  name: string;
  organizationId: string;
  operatingUnitId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  results?: any;
}

export interface ScanFilters {
  organizationId?: string;
  operatingUnitId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ScansResponse {
  scans: Scan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mock scans data
const MOCK_SCANS: Scan[] = [
  {
    id: 'scan-1',
    name: 'Website Accessibility Scan',
    organizationId: 'org-1',
    operatingUnitId: 'ou-1',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: 'user-1',
    results: { score: 85, issues: 12 }
  },
  {
    id: 'scan-2',
    name: 'Mobile App Scan',
    organizationId: 'org-1',
    operatingUnitId: 'ou-2',
    status: 'running',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'scan-3',
    name: 'Document Accessibility Scan',
    organizationId: 'org-2',
    operatingUnitId: 'ou-3',
    status: 'pending',
    createdAt: '2024-01-17T14:00:00Z',
    updatedAt: '2024-01-17T14:00:00Z',
    createdBy: 'user-3'
  }
];

// API functions with data scoping
export async function getScans(
  filters: ScanFilters = {},
  user: UserWithDetails
): Promise<ScansResponse> {
  // Apply data scoping to filter scans based on user's access
  const accessibleScans = dataScopingManager.filterScans(MOCK_SCANS, user);
  
  // Apply additional filters
  let filteredScans = accessibleScans;
  
  if (filters.status) {
    filteredScans = filteredScans.filter(scan => scan.status === filters.status);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredScans = filteredScans.filter(scan => 
      scan.name.toLowerCase().includes(searchLower)
    );
  }
  
  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const total = filteredScans.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedScans = filteredScans.slice(startIndex, endIndex);
  
  return {
    scans: paginatedScans,
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getScanById(scanId: string, user: UserWithDetails): Promise<Scan | null> {
  const scan = MOCK_SCANS.find(s => s.id === scanId);
  
  if (!scan) {
    return null;
  }
  
  // Check if user has access to this scan
  const dataScope = getUserDataScope(user);
  const hasAccess = dataScopingManager.validateDataAccess(user, scan);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  return scan;
}

export async function createScan(
  scanData: Omit<Scan, 'id' | 'createdAt' | 'updatedAt'>,
  user: UserWithDetails
): Promise<Scan> {
  // Validate user has access to the target organization and OU
  const hasAccess = dataScopingManager.validateDataAccess(user, {
    organizationId: scanData.organizationId,
    operatingUnitId: scanData.operatingUnitId
  });
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  const newScan: Scan = {
    ...scanData,
    id: `scan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // In a real implementation, this would save to database
  MOCK_SCANS.push(newScan);
  
  return newScan;
}

export async function updateScan(
  scanId: string,
  updates: Partial<Scan>,
  user: UserWithDetails
): Promise<Scan> {
  const scan = MOCK_SCANS.find(s => s.id === scanId);
  
  if (!scan) {
    throw new Error('Scan not found');
  }
  
  // Validate user has access to this scan
  const hasAccess = dataScopingManager.validateDataAccess(user, scan);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Update scan
  Object.assign(scan, updates, { updatedAt: new Date().toISOString() });
  
  return scan;
}

export async function deleteScan(scanId: string, user: UserWithDetails): Promise<boolean> {
  const scanIndex = MOCK_SCANS.findIndex(s => s.id === scanId);
  
  if (scanIndex === -1) {
    throw new Error('Scan not found');
  }
  
  const scan = MOCK_SCANS[scanIndex];
  
  // Validate user has access to this scan
  const hasAccess = dataScopingManager.validateDataAccess(user, scan);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Delete scan
  MOCK_SCANS.splice(scanIndex, 1);
  
  return true;
}

// Utility function to get scan statistics by organization/OU
export async function getScanStatistics(
  user: UserWithDetails,
  organizationId?: string,
  operatingUnitId?: string
): Promise<{
  totalScans: number;
  completedScans: number;
  runningScans: number;
  failedScans: number;
  averageScore?: number;
}> {
  // Get accessible scans
  let accessibleScans = dataScopingManager.filterScans(MOCK_SCANS, user);
  
  // Apply additional filters if provided
  if (organizationId) {
    accessibleScans = accessibleScans.filter(scan => scan.organizationId === organizationId);
  }
  
  if (operatingUnitId) {
    accessibleScans = accessibleScans.filter(scan => scan.operatingUnitId === operatingUnitId);
  }
  
  const totalScans = accessibleScans.length;
  const completedScans = accessibleScans.filter(scan => scan.status === 'completed').length;
  const runningScans = accessibleScans.filter(scan => scan.status === 'running').length;
  const failedScans = accessibleScans.filter(scan => scan.status === 'failed').length;
  
  // Calculate average score for completed scans
  const completedWithResults = accessibleScans.filter(scan => 
    scan.status === 'completed' && scan.results?.score
  );
  const averageScore = completedWithResults.length > 0
    ? completedWithResults.reduce((sum, scan) => sum + (scan.results?.score || 0), 0) / completedWithResults.length
    : undefined;
  
  return {
    totalScans,
    completedScans,
    runningScans,
    failedScans,
    averageScore
  };
}
