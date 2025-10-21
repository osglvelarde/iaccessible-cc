import { dataScopingManager, getUserDataScope } from './data-scoping';
import { UserWithDetails } from './types/users-roles';

// Example dashboard data structure
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  operatingUnitId: string;
  isPublic: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastViewedAt?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

export interface DashboardFilters {
  organizationId?: string;
  operatingUnitId?: string;
  isPublic?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardsResponse {
  dashboards: Dashboard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mock dashboards data
const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: 'dashboard-1',
    name: 'Accessibility Overview',
    description: 'High-level accessibility metrics and trends',
    organizationId: 'org-1',
    operatingUnitId: 'ou-1',
    isPublic: true,
    widgets: [
      {
        id: 'widget-1',
        type: 'metric',
        title: 'Total Scans',
        config: { value: 45, trend: 'up' },
        position: { x: 0, y: 0, w: 3, h: 2 }
      },
      {
        id: 'widget-2',
        type: 'chart',
        title: 'Scan Results Over Time',
        config: { type: 'line', data: [] },
        position: { x: 3, y: 0, w: 6, h: 4 }
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: 'user-1'
  },
  {
    id: 'dashboard-2',
    name: 'OU Performance Dashboard',
    description: 'Operating unit specific performance metrics',
    organizationId: 'org-1',
    operatingUnitId: 'ou-2',
    isPublic: false,
    widgets: [
      {
        id: 'widget-3',
        type: 'table',
        title: 'Recent Scans',
        config: { columns: ['Name', 'Status', 'Score'] },
        position: { x: 0, y: 0, w: 12, h: 6 }
      }
    ],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'dashboard-3',
    name: 'Executive Summary',
    description: 'Organization-wide accessibility summary',
    organizationId: 'org-2',
    operatingUnitId: 'ou-3',
    isPublic: true,
    widgets: [
      {
        id: 'widget-4',
        type: 'metric',
        title: 'Overall Score',
        config: { value: 78, trend: 'up' },
        position: { x: 0, y: 0, w: 4, h: 2 }
      }
    ],
    createdAt: '2024-01-17T14:00:00Z',
    updatedAt: '2024-01-17T14:00:00Z',
    createdBy: 'user-3'
  }
];

// API functions with data scoping
export async function getDashboards(
  filters: DashboardFilters = {},
  user: UserWithDetails
): Promise<DashboardsResponse> {
  // Apply data scoping to filter dashboards based on user's access
  const accessibleDashboards = dataScopingManager.filterDashboards(MOCK_DASHBOARDS, user);
  
  // Apply additional filters
  let filteredDashboards = accessibleDashboards;
  
  if (filters.isPublic !== undefined) {
    filteredDashboards = filteredDashboards.filter(dashboard => dashboard.isPublic === filters.isPublic);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredDashboards = filteredDashboards.filter(dashboard => 
      dashboard.name.toLowerCase().includes(searchLower) ||
      (dashboard.description && dashboard.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const total = filteredDashboards.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDashboards = filteredDashboards.slice(startIndex, endIndex);
  
  return {
    dashboards: paginatedDashboards,
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getDashboardById(dashboardId: string, user: UserWithDetails): Promise<Dashboard | null> {
  const dashboard = MOCK_DASHBOARDS.find(d => d.id === dashboardId);
  
  if (!dashboard) {
    return null;
  }
  
  // Check if user has access to this dashboard
  const hasAccess = dataScopingManager.validateDataAccess(user, dashboard);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Update last viewed timestamp
  dashboard.lastViewedAt = new Date().toISOString();
  
  return dashboard;
}

export async function createDashboard(
  dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>,
  user: UserWithDetails
): Promise<Dashboard> {
  // Validate user has access to the target organization and OU
  const hasAccess = dataScopingManager.validateDataAccess(user, {
    organizationId: dashboardData.organizationId,
    operatingUnitId: dashboardData.operatingUnitId
  });
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  const newDashboard: Dashboard = {
    ...dashboardData,
    id: `dashboard-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // In a real implementation, this would save to database
  MOCK_DASHBOARDS.push(newDashboard);
  
  return newDashboard;
}

export async function updateDashboard(
  dashboardId: string,
  updates: Partial<Dashboard>,
  user: UserWithDetails
): Promise<Dashboard> {
  const dashboard = MOCK_DASHBOARDS.find(d => d.id === dashboardId);
  
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }
  
  // Validate user has access to this dashboard
  const hasAccess = dataScopingManager.validateDataAccess(user, dashboard);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Update dashboard
  Object.assign(dashboard, updates, { updatedAt: new Date().toISOString() });
  
  return dashboard;
}

export async function deleteDashboard(dashboardId: string, user: UserWithDetails): Promise<boolean> {
  const dashboardIndex = MOCK_DASHBOARDS.findIndex(d => d.id === dashboardId);
  
  if (dashboardIndex === -1) {
    throw new Error('Dashboard not found');
  }
  
  const dashboard = MOCK_DASHBOARDS[dashboardIndex];
  
  // Validate user has access to this dashboard
  const hasAccess = dataScopingManager.validateDataAccess(user, dashboard);
  
  if (!hasAccess.allowed) {
    throw new Error('Access denied: ' + hasAccess.reason);
  }
  
  // Delete dashboard
  MOCK_DASHBOARDS.splice(dashboardIndex, 1);
  
  return true;
}

// Utility function to get dashboard statistics
export async function getDashboardStatistics(
  user: UserWithDetails,
  organizationId?: string,
  operatingUnitId?: string
): Promise<{
  totalDashboards: number;
  publicDashboards: number;
  privateDashboards: number;
  recentlyViewed: number;
}> {
  // Get accessible dashboards
  let accessibleDashboards = dataScopingManager.filterDashboards(MOCK_DASHBOARDS, user);
  
  // Apply additional filters if provided
  if (organizationId) {
    accessibleDashboards = accessibleDashboards.filter(dashboard => dashboard.organizationId === organizationId);
  }
  
  if (operatingUnitId) {
    accessibleDashboards = accessibleDashboards.filter(dashboard => dashboard.operatingUnitId === operatingUnitId);
  }
  
  const totalDashboards = accessibleDashboards.length;
  const publicDashboards = accessibleDashboards.filter(dashboard => dashboard.isPublic).length;
  const privateDashboards = accessibleDashboards.filter(dashboard => !dashboard.isPublic).length;
  
  // Count recently viewed dashboards (within last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentlyViewed = accessibleDashboards.filter(dashboard => 
    dashboard.lastViewedAt && new Date(dashboard.lastViewedAt) > sevenDaysAgo
  ).length;
  
  return {
    totalDashboards,
    publicDashboards,
    privateDashboards,
    recentlyViewed
  };
}

// Function to get public dashboards (no authentication required)
export async function getPublicDashboards(
  filters: Omit<DashboardFilters, 'organizationId' | 'operatingUnitId'> = {}
): Promise<Dashboard[]> {
  let publicDashboards = MOCK_DASHBOARDS.filter(dashboard => dashboard.isPublic);
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    publicDashboards = publicDashboards.filter(dashboard => 
      dashboard.name.toLowerCase().includes(searchLower) ||
      (dashboard.description && dashboard.description.toLowerCase().includes(searchLower))
    );
  }
  
  return publicDashboards;
}
