export interface WaveStatus {
  success: boolean;
  httpstatuscode: number;
  error?: string;
}

export interface WaveStatistics {
  pagetitle: string;
  pageurl: string;
  time: number;
  creditsremaining: number | string;
  allitemcount: number;
  totalelements: number;
  waveurl?: string;
}

export interface WaveItem {
  id: string;
  description: string;
  count: number;
  xpaths?: string[];
  contrastdata?: Array<[number, string, string, boolean]>; // [ratio, fgColor, bgColor, isLarge]
}

export interface WaveCategory {
  description: string;
  count: number;
  items: Record<string, WaveItem>;
}

export interface WaveResponse {
  status: WaveStatus;
  statistics: WaveStatistics;
  categories: {
    error?: WaveCategory;
    contrast?: WaveCategory;
    alert?: WaveCategory;
    feature?: WaveCategory;
    structure?: WaveCategory;
    aria?: WaveCategory;
  };
}

export interface WaveScanOptions {
  timeout?: number;
  retries?: number;
}

/**
 * Scans a URL using the WAVE API via Next.js API route
 * @param url - The URL to scan
 * @param options - Optional configuration (for future use)
 * @returns The WAVE API response
 */
export async function waveScanUrl(
  url: string,
  options: WaveScanOptions = {}
): Promise<WaveResponse> {
  try {
    const response = await fetch('/api/wave/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: WaveResponse = await response.json();
    
    // Check if the API returned a success status
    if (!data.status.success) {
      throw new Error(data.status.error || "WAVE API returned unsuccessful status");
    }

    return data;
  } catch (error) {
    console.error('WAVE scan error:', error);
    throw error;
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return string.startsWith('http://') || string.startsWith('https://');
  } catch {
    try {
      // Try with https prefix
      new URL(`https://${string}`);
      return true;
    } catch {
      return false;
    }
  }
}

