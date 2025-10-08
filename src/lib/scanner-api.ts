export interface ScanOptions {
  policies?: string[];
  scanDepth?: string;
  includeExternal?: boolean;
}

export interface ScanResponse {
  scanId: string;
  url: string;
  timestamp: string;
  status: 'completed' | 'failed';
  summary: {
    accessibilityScore: number;
    seoScore: number;
    readabilityScore: number;
    totalIssues: number;
    totalRules?: number;
    violations?: number;
    potentialViolations?: number;
    recommendations?: number;
    passed?: number;
  };
  issues: Array<{
    id: number;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    location: string;
    details: string;
    ruleId?: string;
    category?: string;
    xpath?: string;
    ariaPath?: string;
  }>;
  scanDuration?: number;
  error?: string;
}

export async function scanUrl(url: string, options: ScanOptions = {}): Promise<ScanResponse> {
  try {
    const response = await fetch('http://localhost:4000/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, options }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scanner API error:', error);
    throw error;
  }
}

export interface ScanHistoryItem {
  id: string;
  url: string;
  date: string;
  status: "completed" | "failed" | "running";
  accessibilityScore: number | null;
  seoScore: number | null;
  readabilityScore: number | null;
  totalIssues: number;
}

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const response = await fetch('http://localhost:4000/scans');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scanner history API error:', error);
    throw error;
  }
}

export async function getScanResult(scanId: string): Promise<ScanResponse> {
  try {
    const response = await fetch(`http://localhost:4000/scans/${scanId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Scan not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get scan result API error:', error);
    throw error;
  }
}
