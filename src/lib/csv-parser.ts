export interface CrawledPage {
  webpage: string;
  internalExternal: 'Internal' | 'External';
  parent: string;
  domain: string;
  dateScanned: string;
  pdf: 'Yes' | 'No';
  urlType: string;
  lastModifiedDate: string;
  year: number;
  month: number;
  day: number;
  departmentName: string; // Keep for backward compatibility
  operatingUnitName: string; // New field - maps to departmentName
  organizationName: string;
  pocFirstName: string;
  pocLastName: string;
  pocEmail: string;
  jobId: string;
}

export async function parseCrawledPages(): Promise<CrawledPage[]> {
  try {
    const response = await fetch('/df_doc_crawler1.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const pages: CrawledPage[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length >= headers.length) {
        const page: CrawledPage = {
          webpage: values[0] || '',
          internalExternal: (values[1] as 'Internal' | 'External') || 'External',
          parent: values[2] || '',
          domain: values[3] || '',
          dateScanned: values[4] || '',
          pdf: (values[5] as 'Yes' | 'No') || 'No',
          urlType: values[6] || '',
          lastModifiedDate: values[7] || '',
          year: parseInt(values[8]) || 0,
          month: parseInt(values[9]) || 0,
          day: parseInt(values[10]) || 0,
          departmentName: values[11] || '',
          operatingUnitName: values[11] || '', // Map departmentName to operatingUnitName
          organizationName: values[12] || '',
          pocFirstName: values[13] || '',
          pocLastName: values[14] || '',
          pocEmail: values[15] || '',
          jobId: values[16] || ''
        };
        
        // Only include actual web pages (not PDFs or other file types)
        if (page.urlType === 'Url' && page.webpage) {
          pages.push(page);
        }
      }
    }
    
    return pages;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function getUniqueDepartments(pages: CrawledPage[]): string[] {
  return Array.from(new Set(pages.map(p => p.departmentName).filter(Boolean))).sort();
}

export function getUniqueOperatingUnits(pages: CrawledPage[]): string[] {
  return Array.from(new Set(pages.map(p => p.operatingUnitName).filter(Boolean))).sort();
}

export function getUniqueOrganizations(pages: CrawledPage[]): string[] {
  return Array.from(new Set(pages.map(p => p.organizationName).filter(Boolean))).sort();
}

export function filterPages(
  pages: CrawledPage[],
  filters: {
    search?: string;
    department?: string;
    operatingUnit?: string;
    organization?: string;
    internalExternal?: 'Internal' | 'External';
    dateFrom?: string;
    dateTo?: string;
  }
): CrawledPage[] {
  return pages.filter(page => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!page.webpage.toLowerCase().includes(searchLower) &&
          !page.departmentName.toLowerCase().includes(searchLower) &&
          !page.operatingUnitName.toLowerCase().includes(searchLower) &&
          !page.organizationName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Department filter (backward compatibility)
    if (filters.department && page.departmentName !== filters.department) {
      return false;
    }
    
    // Operating Unit filter
    if (filters.operatingUnit && page.operatingUnitName !== filters.operatingUnit) {
      return false;
    }
    
    // Organization filter
    if (filters.organization && page.organizationName !== filters.organization) {
      return false;
    }
    
    // Internal/External filter
    if (filters.internalExternal && page.internalExternal !== filters.internalExternal) {
      return false;
    }
    
    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const pageDate = new Date(page.dateScanned);
      if (filters.dateFrom && pageDate < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && pageDate > new Date(filters.dateTo)) {
        return false;
      }
    }
    
    return true;
  });
}
