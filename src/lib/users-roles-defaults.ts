import { 
  User,
  UserGroup, 
  ModulePermission, 
  FeaturePermission, 
  OperatingUnit, 
  Organization,
  ModuleFeatures,
  RoleType 
} from './types/users-roles';

// Define module features for granular permissions
export const MODULE_FEATURES: ModuleFeatures = {
  dashboard: {
    moduleName: 'Dashboard',
    features: {
      view_metrics: { name: 'View Metrics', description: 'View accessibility metrics and KPIs' },
      view_alerts: { name: 'View Alerts', description: 'View system alerts and notifications' },
      export_data: { name: 'Export Data', description: 'Export dashboard data to various formats' }
    }
  },
  dataQuery: {
    moduleName: 'Data Query Module',
    features: {
      run_queries: { name: 'Run Queries', description: 'Execute data queries and searches' },
      save_queries: { name: 'Save Queries', description: 'Save and manage query templates' },
      export_results: { name: 'Export Results', description: 'Export query results to files' },
      schedule_queries: { name: 'Schedule Queries', description: 'Schedule recurring queries' }
    }
  },
  uptimeMonitoring: {
    moduleName: 'Uptime Monitoring Tool',
    features: {
      view_status: { name: 'View Status', description: 'View uptime status and availability metrics' },
      configure_monitors: { name: 'Configure Monitors', description: 'Configure uptime monitoring targets and thresholds' },
      view_alerts: { name: 'View Alerts', description: 'View uptime alerts and notifications' },
      view_reports: { name: 'View Reports', description: 'View uptime reports and historical data' }
    }
  },
  webpageScan: {
    moduleName: 'Webpage Scan',
    features: {
      start_scan: { name: 'Start Scan', description: 'Initiate new webpage scans' },
      view_results: { name: 'View Results', description: 'View scan results and reports' },
      download_reports: { name: 'Download Reports', description: 'Download scan reports' },
      schedule_scans: { name: 'Schedule Scans', description: 'Schedule recurring scans' }
    }
  },
  pdfScan: {
    moduleName: 'PDF Accessibility Scan',
    features: {
      upload_pdf: { name: 'Upload PDF', description: 'Upload PDF files for scanning' },
      view_results: { name: 'View Results', description: 'View PDF scan results' },
      download_reports: { name: 'Download Reports', description: 'Download PDF scan reports' }
    }
  },
  sitemap: {
    moduleName: 'Sitemap Generator',
    features: {
      generate_sitemap: { name: 'Generate Sitemap', description: 'Generate sitemaps from URLs' },
      view_structure: { name: 'View Structure', description: 'View site structure visualization' },
      export_sitemap: { name: 'Export Sitemap', description: 'Export sitemap in various formats' }
    }
  },
  scanMonitor: {
    moduleName: 'Scans Monitor',
    features: {
      view_scans: { name: 'View Scans', description: 'View all scan statuses' },
      cancel_scans: { name: 'Cancel Scans', description: 'Cancel running scans' },
      retry_scans: { name: 'Retry Scans', description: 'Retry failed scans' },
      view_logs: { name: 'View Logs', description: 'View detailed scan logs' }
    }
  },
  scansScheduler: {
    moduleName: 'Scans Scheduler',
    features: {
      create_schedules: { name: 'Create Schedules', description: 'Create new scan schedules' },
      edit_schedules: { name: 'Edit Schedules', description: 'Modify existing schedules' },
      delete_schedules: { name: 'Delete Schedules', description: 'Delete scan schedules' },
      view_schedules: { name: 'View Schedules', description: 'View all scheduled scans' }
    }
  },
  intake: {
    moduleName: 'Intake Form',
    features: {
      create_intake: { name: 'Create Intake', description: 'Create new intake forms' },
      edit_intake: { name: 'Edit Intake', description: 'Edit existing intake forms' },
      view_intakes: { name: 'View Intakes', description: 'View all intake forms' },
      approve_intakes: { name: 'Approve Intakes', description: 'Approve submitted intakes' }
    }
  },
  manualTesting: {
    moduleName: 'Manual Testing Tool',
    features: {
      create_test: { name: 'Create Test', description: 'Create new manual test sessions' },
      edit_test: { name: 'Edit Test', description: 'Edit test sessions' },
      view_tests: { name: 'View Tests', description: 'View all test sessions' },
      score_tests: { name: 'Score Tests', description: 'Score and evaluate tests' },
      upload_evidence: { name: 'Upload Evidence', description: 'Upload test evidence files' }
    }
  },
  pdfRemediation: {
    moduleName: 'PDF Remediation Module',
    features: {
      view_issues: { name: 'View Issues', description: 'View PDF accessibility issues' },
      remediate_pdf: { name: 'Remediate PDF', description: 'Fix PDF accessibility issues' },
      track_progress: { name: 'Track Progress', description: 'Track remediation progress' },
      export_fixed: { name: 'Export Fixed', description: 'Export remediated PDFs' }
    }
  },
  guidelines: {
    moduleName: 'Guidelines & Resources',
    features: {
      view_guidelines: { name: 'View Guidelines', description: 'View WCAG and compliance guidelines' },
      download_resources: { name: 'Download Resources', description: 'Download compliance resources' },
      search_content: { name: 'Search Content', description: 'Search through guidelines content' }
    }
  },
  supportBot: {
    moduleName: 'Training & Customer Service Chatbot',
    features: {
      chat_support: { name: 'Chat Support', description: 'Use chatbot for support' },
      view_history: { name: 'View History', description: 'View chat history' },
      rate_responses: { name: 'Rate Responses', description: 'Rate chatbot responses' }
    }
  },
  settings: {
    moduleName: 'Settings',
    features: {
      view_settings: { name: 'View Settings', description: 'View system settings' },
      edit_domains: { name: 'Edit Domains', description: 'Manage domain settings' },
      edit_branding: { name: 'Edit Branding', description: 'Manage branding settings' },
      edit_integrations: { name: 'Edit Integrations', description: 'Manage integrations' }
    }
  },
  usersRoles: {
    moduleName: 'Users & Roles',
    features: {
      view_users: { name: 'View Users', description: 'View all users' },
      create_users: { name: 'Create Users', description: 'Create new users' },
      edit_users: { name: 'Edit Users', description: 'Edit user details' },
      manage_groups: { name: 'Manage Groups', description: 'Manage user groups' },
      view_audit_logs: { name: 'View Audit Logs', description: 'View system audit logs' }
    }
  }
};

// Helper function to create module permissions
function createModulePermission(
  moduleKey: string, 
  accessLevel: 'none' | 'read' | 'write' | 'execute',
  featureAccess: Record<string, 'none' | 'read' | 'write' | 'execute'> = {}
): ModulePermission {
  const moduleFeatures = MODULE_FEATURES[moduleKey];
  if (!moduleFeatures) {
    throw new Error(`Module ${moduleKey} not found in MODULE_FEATURES`);
  }

  const features: FeaturePermission[] = Object.entries(moduleFeatures.features).map(([featureKey, feature]) => ({
    featureKey,
    featureName: feature.name,
    accessLevel: featureAccess[featureKey] || accessLevel,
    description: feature.description
  }));

  return {
    moduleKey,
    moduleName: moduleFeatures.moduleName,
    accessLevel,
    features
  };
}

// Predefined role templates
export const PREDEFINED_ROLES: Record<RoleType, Omit<UserGroup, 'id' | 'organizationId' | 'operatingUnitId' | 'scope' | 'createdAt' | 'updatedAt' | 'createdBy'>> = {
  viewer: {
    name: 'Viewer',
    type: 'predefined',
    roleType: 'viewer',
    permissions: [
      createModulePermission('dashboard', 'read'),
      createModulePermission('dataQuery', 'read'),
      createModulePermission('guidelines', 'read'),
      createModulePermission('supportBot', 'read')
    ],
    description: 'Read-only access to dashboards, data queries, guidelines, and support',
    isSystemGroup: true
  },
  administrator: {
    name: 'Administrator',
    type: 'predefined',
    roleType: 'administrator',
    permissions: [
      createModulePermission('dashboard', 'read'),
      createModulePermission('dataQuery', 'read'),
      createModulePermission('webpageScan', 'execute'),
      createModulePermission('pdfScan', 'execute'),
      createModulePermission('sitemap', 'execute'),
      createModulePermission('scanMonitor', 'read'),
      createModulePermission('scansScheduler', 'execute'),
      createModulePermission('guidelines', 'read'),
      createModulePermission('supportBot', 'read')
    ],
    description: 'Can run assessments and view results, but cannot manage users or system settings',
    isSystemGroup: true
  },
  operating_unit_admin: {
    name: 'Operating Unit Administrator',
    type: 'predefined',
    roleType: 'operating_unit_admin',
    permissions: [
      createModulePermission('dashboard', 'read'),
      createModulePermission('dataQuery', 'read'),
      createModulePermission('uptimeMonitoring', 'execute'),
      createModulePermission('webpageScan', 'execute'),
      createModulePermission('pdfScan', 'execute'),
      createModulePermission('sitemap', 'execute'),
      createModulePermission('scanMonitor', 'read'),
      createModulePermission('scansScheduler', 'execute'),
      createModulePermission('intake', 'write'),
      createModulePermission('settings', 'write', {
        view_settings: 'read',
        edit_domains: 'write',
        edit_branding: 'write',
        edit_integrations: 'write'
      }),
      createModulePermission('guidelines', 'read'),
      createModulePermission('supportBot', 'read')
    ],
    description: 'Full access to all modules within their operating unit, including intake and settings',
    isSystemGroup: true
  },
  remediator_tester: {
    name: 'Remediator/Tester',
    type: 'predefined',
    roleType: 'remediator_tester',
    permissions: [
      createModulePermission('dashboard', 'read'),
      createModulePermission('dataQuery', 'read'),
      createModulePermission('webpageScan', 'execute'),
      createModulePermission('pdfScan', 'execute'),
      createModulePermission('sitemap', 'execute'),
      createModulePermission('scanMonitor', 'read'),
      createModulePermission('scansScheduler', 'execute'),
      createModulePermission('manualTesting', 'write'),
      createModulePermission('pdfRemediation', 'write'),
      createModulePermission('guidelines', 'read'),
      createModulePermission('supportBot', 'read')
    ],
    description: 'Access to all modules plus specialized testing and remediation tools',
    isSystemGroup: true
  },
  organization_admin: {
    name: 'Organization Administrator',
    type: 'predefined',
    roleType: 'organization_admin',
    permissions: [
      createModulePermission('dashboard', 'read'),
      createModulePermission('dataQuery', 'read'),
      createModulePermission('uptimeMonitoring', 'execute'),
      createModulePermission('webpageScan', 'execute'),
      createModulePermission('pdfScan', 'execute'),
      createModulePermission('sitemap', 'execute'),
      createModulePermission('scanMonitor', 'read'),
      createModulePermission('scansScheduler', 'execute'),
      createModulePermission('intake', 'write'),
      createModulePermission('manualTesting', 'write'),
      createModulePermission('pdfRemediation', 'write'),
      createModulePermission('settings', 'write'),
      createModulePermission('usersRoles', 'execute', {
        view_users: 'read',
        create_users: 'execute',
        edit_users: 'execute',
        manage_groups: 'execute',
        view_audit_logs: 'read'
      }),
      createModulePermission('guidelines', 'read'),
      createModulePermission('supportBot', 'read')
    ],
    description: 'Full access to all modules within their organization, can manage users/groups across all operating units',
    isSystemGroup: true
  },
  global_admin: {
    name: 'Global Administrator',
    type: 'predefined',
    roleType: 'global_admin',
    permissions: Object.keys(MODULE_FEATURES).map(moduleKey => 
      createModulePermission(moduleKey, 'execute')
    ),
    description: 'Full system access including user management and global settings',
    isSystemGroup: true
  }
};

// Default organizations
export const DEFAULT_ORGANIZATIONS: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Federal Agency Alpha',
    slug: 'federal-agency-alpha',
    domains: ['alpha.gov'],
    status: 'active',
    settings: {
      allowCustomGroups: true,
      maxUsers: 1000,
      maxOperatingUnits: 50,
      features: ['web_scan', 'pdf_scan', 'manual_testing', 'remediation']
    }
  },
  {
    name: 'State Department Beta',
    slug: 'state-dept-beta',
    domains: ['beta.state.gov'],
    status: 'active',
    settings: {
      allowCustomGroups: true,
      maxUsers: 500,
      maxOperatingUnits: 20,
      features: ['web_scan', 'pdf_scan']
    }
  }
];

// Default operating units
export const DEFAULT_OPERATING_UNITS: Omit<OperatingUnit, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    organizationId: 'org-1',
    name: 'Digital Services',
    organization: 'Department of Technology',
    domains: ['tech.gov', 'digital.gov'],
    description: 'Primary digital services operating unit'
  },
  {
    organizationId: 'org-1',
    name: 'Public Affairs',
    organization: 'Department of Communications',
    domains: ['public.gov', 'news.gov'],
    description: 'Public affairs and communications unit'
  },
  {
    organizationId: 'org-2',
    name: 'Accessibility Office',
    organization: 'Department of Civil Rights',
    domains: ['accessibility.gov', 'ada.gov'],
    description: 'Central accessibility compliance office'
  }
];

// Mock users for testing
export const MOCK_USERS: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    email: 'admin@example.gov',
    firstName: 'Admin',
    lastName: 'User',
    operatingUnitId: 'ou-1',
    groupIds: ['group-global-admin'],
    status: 'active',
    lastLogin: new Date().toISOString()
  },
  {
    email: 'orgadmin@example.gov',
    firstName: 'Org',
    lastName: 'Admin',
    operatingUnitId: 'ou-1',
    groupIds: ['group-organization-admin'],
    status: 'active',
    lastLogin: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    email: 'manager@example.gov',
    firstName: 'Manager',
    lastName: 'Smith',
    operatingUnitId: 'ou-1',
    groupIds: ['group-operating-unit-admin'],
    status: 'active',
    lastLogin: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    email: 'tester@example.gov',
    firstName: 'Tester',
    lastName: 'Johnson',
    operatingUnitId: 'ou-1',
    groupIds: ['group-remediator-tester'],
    status: 'active',
    lastLogin: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    email: 'viewer@example.gov',
    firstName: 'Viewer',
    lastName: 'Brown',
    operatingUnitId: 'ou-2',
    groupIds: ['group-viewer'],
    status: 'active',
    lastLogin: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    email: 'pending@example.gov',
    firstName: 'Pending',
    lastName: 'User',
    operatingUnitId: 'ou-1',
    groupIds: ['group-viewer'],
    status: 'pending',
    invitationToken: 'invite-token-123',
    invitationExpiresAt: new Date(Date.now() + 604800000).toISOString() // 7 days from now
  }
];

// Helper function to create a predefined group for a specific operating unit
export function createPredefinedGroupForOperatingUnit(
  roleType: RoleType, 
  organizationId: string,
  operatingUnitId: string | null, 
  createdBy: string
): Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'> {
  const roleTemplate = PREDEFINED_ROLES[roleType];
  const scope = operatingUnitId ? 'operating_unit' : 'organization';
  return {
    ...roleTemplate,
    organizationId,
    operatingUnitId,
    scope,
    createdBy
  };
}

// Helper function to get all available modules for permission assignment
export function getAllModules(): string[] {
  return Object.keys(MODULE_FEATURES);
}

// Helper function to get features for a specific module
export function getModuleFeatures(moduleKey: string): string[] {
  const moduleFeatures = MODULE_FEATURES[moduleKey];
  return moduleFeatures ? Object.keys(moduleFeatures.features) : [];
}
