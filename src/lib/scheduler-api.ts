export type ScanType = 
  | 'webpage-accessibility'
  | 'pdf-accessibility' 
  | 'sitemap-crawl'
  | 'readability'
  | 'seo'
  | 'manual-testing';

export type FrequencyType = 
  | 'one-time'
  | 'daily'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'quarterly';

export type SignInMethod = 
  | 'basic-auth'
  | 'sso'
  | 'mfa'
  | 'other';

export type Persona = 
  | 'citizen'
  | 'employee'
  | 'vendor'
  | 'administrator';

export interface AuthenticationConfig {
  requiresAuth: boolean;
  signInMethod?: SignInMethod;
  testAccountDetails?: string;
  persona?: Persona;
  purposeArea?: string;
}

export interface DomainConfig {
  primaryDomain: string;
  subdomains: string[];
  manualPages?: string[]; // For manual testing URLs
}

export interface ScheduleConfig {
  id?: string;
  organization: string;
  operatingUnit: string;
  scanTypes: ScanType[];
  domainConfig: DomainConfig;
  frequency: FrequencyType;
  startDate: string; // ISO date string
  startTime: string; // HH:MM format
  endDate?: string; // ISO date string, optional for recurring
  dayOfWeek?: number[]; // 0-6 for weekly/bi-weekly
  dayOfMonth?: number; // 1-31 for monthly
  quarterMonth?: number; // 1-12 for quarterly
  authentication: AuthenticationConfig;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface OperatingUnit {
  id: string;
  name: string;
  organization: string;
  description?: string;
}

export interface IntakeDomain {
  id: string;
  domain: string;
  subdomains: string[];
  operatingUnitId: string;
}

// Mock API functions
export async function createSchedule(config: ScheduleConfig): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Creating schedule:', config);
    
    // Mock success response
    return {
      success: true,
      scheduleId: `schedule_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create schedule'
    };
  }
}

export async function getOperatingUnits(): Promise<OperatingUnit[]> {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data based on DOC structure
    return [
      {
        id: 'doc-bis',
        name: 'Bureau of Industry and Security',
        organization: 'Department of Commerce',
        description: 'BIS promotes U.S. national security, foreign policy, and economic objectives'
      },
      {
        id: 'doc-census',
        name: 'U.S. Census Bureau',
        organization: 'Department of Commerce',
        description: 'Leading source of quality data about the nation\'s people and economy'
      },
      {
        id: 'doc-eda',
        name: 'Economic Development Administration',
        organization: 'Department of Commerce',
        description: 'EDA leads the federal economic development agenda'
      },
      {
        id: 'doc-esa',
        name: 'Economics and Statistics Administration',
        organization: 'Department of Commerce',
        description: 'ESA provides economic analysis and statistical data'
      },
      {
        id: 'doc-ita',
        name: 'International Trade Administration',
        organization: 'Department of Commerce',
        description: 'ITA strengthens the competitiveness of U.S. industry'
      }
    ];
  } catch (error) {
    console.error('Failed to fetch operating units:', error);
    return [];
  }
}

export async function getIntakeDomains(operatingUnitId: string): Promise<IntakeDomain[]> {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock data - would come from intake form submissions
    const mockDomains: Record<string, IntakeDomain[]> = {
      'doc-bis': [
        {
          id: 'bis-main',
          domain: 'bis.doc.gov',
          subdomains: ['www.bis.doc.gov', 'export.bis.doc.gov'],
          operatingUnitId: 'doc-bis'
        }
      ],
      'doc-census': [
        {
          id: 'census-main',
          domain: 'census.gov',
          subdomains: ['www.census.gov', 'data.census.gov', 'my2020census.gov'],
          operatingUnitId: 'doc-census'
        }
      ],
      'doc-eda': [
        {
          id: 'eda-main',
          domain: 'eda.gov',
          subdomains: ['www.eda.gov', 'grants.eda.gov'],
          operatingUnitId: 'doc-eda'
        }
      ]
    };
    
    return mockDomains[operatingUnitId] || [];
  } catch (error) {
    console.error('Failed to fetch intake domains:', error);
    return [];
  }
}

export async function saveScheduleDraft(config: Partial<ScheduleConfig>): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Saving draft:', config);
    
    return {
      success: true,
      draftId: `draft_${Date.now()}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save draft'
    };
  }
}

// Validation helpers
export function validateScheduleConfig(config: Partial<ScheduleConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.organization) {
    errors.push('Organization is required');
  }
  
  if (!config.operatingUnit) {
    errors.push('Operating Unit is required');
  }
  
  if (!config.scanTypes || config.scanTypes.length === 0) {
    errors.push('At least one scan type must be selected');
  }
  
  if (!config.domainConfig?.primaryDomain) {
    errors.push('Primary domain is required');
  }
  
  if (!config.frequency) {
    errors.push('Schedule frequency is required');
  }
  
  if (!config.startDate) {
    errors.push('Start date is required');
  }
  
  if (!config.startTime) {
    errors.push('Start time is required');
  }
  
  // Validate date ranges
  if (config.startDate && config.endDate) {
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }
  }
  
  // Validate start date is in the future
  if (config.startDate) {
    const startDate = new Date(config.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      errors.push('Start date must be today or in the future');
    }
  }
  
  // Validate start time is in the future if start date is today
  if (config.startDate && config.startTime) {
    const startDate = new Date(config.startDate);
    const today = new Date();
    const isToday = startDate.toDateString() === today.toDateString();
    
    if (isToday) {
      const [hours, minutes] = config.startTime.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(hours, minutes, 0, 0);
      
      if (startDateTime <= today) {
        errors.push('Start time must be in the future when start date is today');
      }
    }
  }
  
  // Validate domain format
  if (config.domainConfig?.primaryDomain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    if (!domainRegex.test(config.domainConfig.primaryDomain)) {
      errors.push('Primary domain must be a valid domain format (e.g., agency.gov)');
    }
  }
  
  // Validate subdomain formats
  if (config.domainConfig?.subdomains) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    for (const subdomain of config.domainConfig.subdomains) {
      if (!domainRegex.test(subdomain)) {
        errors.push(`Subdomain "${subdomain}" must be a valid domain format`);
        break; // Only show first invalid subdomain error
      }
    }
  }
  
  // Validate manual testing URLs if manual testing is selected
  if (config.scanTypes?.includes('manual-testing') && config.domainConfig?.manualPages) {
    const urlRegex = /^https?:\/\/.+/;
    for (const url of config.domainConfig.manualPages) {
      if (url.trim() && !urlRegex.test(url.trim())) {
        errors.push(`Manual testing URL "${url}" must be a valid URL starting with http:// or https://`);
        break; // Only show first invalid URL error
      }
    }
  }
  
  // Validate frequency-specific requirements
  if (config.frequency === 'weekly' || config.frequency === 'bi-weekly') {
    if (!config.dayOfWeek || config.dayOfWeek.length === 0) {
      errors.push('At least one day of the week must be selected for weekly/bi-weekly schedules');
    }
  }
  
  if (config.frequency === 'monthly') {
    if (!config.dayOfMonth) {
      errors.push('Day of month must be selected for monthly schedules');
    }
  }
  
  if (config.frequency === 'quarterly') {
    if (!config.quarterMonth) {
      errors.push('Month must be selected for quarterly schedules');
    }
  }
  
  // Validate authentication requirements
  if (config.authentication?.requiresAuth) {
    if (!config.authentication.signInMethod) {
      errors.push('Sign-in method is required when authentication is enabled');
    }
    
    if (!config.authentication.testAccountDetails?.trim()) {
      errors.push('Test account details are required when authentication is enabled');
    }
    
    if (!config.authentication.persona) {
      errors.push('User persona is required when authentication is enabled');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
