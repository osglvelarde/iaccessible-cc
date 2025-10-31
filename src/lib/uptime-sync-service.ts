// Domain Sync Service - Sync Operating Unit domains to Uptime Kuma
import { OperatingUnit } from './types/users-roles';
import { getMonitors, UptimeKumaMonitor } from './uptime-kuma-api';

// Use absolute URL for server-side requests
const API_BASE = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  : 'http://localhost:3000';

export interface SyncResult {
  success: boolean;
  message: string;
  addedMonitors: string[];
  skippedMonitors: string[];
  errors: string[];
}

/**
 * Fetch all Operating Units from the API
 */
async function getOperatingUnits(): Promise<OperatingUnit[]> {
  try {
    const response = await fetch(`${API_BASE}/api/users-roles/operating-units`);
    if (!response.ok) {
      throw new Error(`Failed to fetch operating units: ${response.status}`);
    }
    const data = await response.json();
    return data.operatingUnits || [];
  } catch (error) {
    console.error('Error fetching operating units:', error);
    throw error;
  }
}

/**
 * Extract unique domains from Operating Units
 */
function extractDomains(operatingUnits: OperatingUnit[]): string[] {
  const domains = new Set<string>();
  
  for (const unit of operatingUnits) {
    for (const domain of unit.domains) {
      // Normalize domain - ensure it has https:// prefix
      let normalizedDomain = domain.trim();
      if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
        normalizedDomain = `https://${normalizedDomain}`;
      }
      domains.add(normalizedDomain);
    }
  }
  
  return Array.from(domains);
}

/**
 * Get existing monitors from Uptime Kuma
 */
async function getExistingMonitors(): Promise<UptimeKumaMonitor[]> {
  try {
    console.log('Fetching monitors from Uptime Kuma...');
    const monitors = await getMonitors();
    console.log(`Found ${monitors.length} monitors:`, monitors.map(m => `${m.name} (${m.url})`));
    return monitors;
  } catch (error) {
    console.error('Error fetching existing monitors:', error);
    // Return empty array instead of throwing to allow sync to continue
    return [];
  }
}

/**
 * Create a monitor in Uptime Kuma via Python API wrapper
 */
async function createMonitorInUptimeKuma(domain: string): Promise<boolean> {
  try {
    // Use the createMonitor function from uptime-kuma-api.ts
    // which calls the Next.js API route that executes Python scripts
    const { createMonitor } = await import('./uptime-kuma-api');
    
    await createMonitor({
      name: domain,
      url: `https://${domain}`,
      type: 'https',
      heartbeatInterval: 60,
      retries: 0,
      heartbeatRetryInterval: 60,
      requestTimeout: 48,
    });
    
    return true;
  } catch (error) {
    console.error(`Error creating monitor for ${domain}:`, error);
    return false;
  }
}

/**
 * Sync domains from Operating Units to Uptime Kuma
 */
export async function syncOperatingUnitDomains(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    message: '',
    addedMonitors: [],
    skippedMonitors: [],
    errors: []
  };

  try {
    console.log('Starting domain sync...');
    
    // Step 1: Get Operating Units
    console.log('Fetching Operating Units...');
    const operatingUnits = await getOperatingUnits();
    console.log(`Found ${operatingUnits.length} Operating Units`);
    
    // Step 2: Extract unique domains
    console.log('Extracting domains...');
    const domains = extractDomains(operatingUnits);
    console.log(`Found ${domains.length} unique domains:`, domains);
    
    // Step 3: Get existing monitors
    console.log('Fetching existing monitors...');
    const existingMonitors = await getExistingMonitors();
    const existingUrls = new Set(existingMonitors.map(m => m.url));
    console.log(`Found ${existingMonitors.length} existing monitors`);
    
    // Step 4: Find domains that need monitoring
    const domainsToAdd = domains.filter(domain => !existingUrls.has(domain));
    console.log(`Found ${domainsToAdd.length} domains to add:`, domainsToAdd);
    
    // Step 5: Create monitors for new domains
    for (const domain of domainsToAdd) {
      try {
        const success = await createMonitorInUptimeKuma(domain);
        if (success) {
          result.addedMonitors.push(domain);
          console.log(`✅ Added monitor for: ${domain}`);
        } else {
          result.errors.push(`Failed to create monitor for: ${domain}`);
          console.log(`❌ Failed to add monitor for: ${domain}`);
        }
      } catch (error) {
        const errorMsg = `Error creating monitor for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // Step 6: Report skipped domains (already monitored)
    const skippedDomains = domains.filter(domain => existingUrls.has(domain));
    result.skippedMonitors = skippedDomains;
    console.log(`Skipped ${skippedDomains.length} already monitored domains:`, skippedDomains);
    
    // Step 7: Generate summary message
    const totalProcessed = result.addedMonitors.length + result.skippedMonitors.length + result.errors.length;
    result.message = `Sync completed. Added: ${result.addedMonitors.length}, Skipped: ${result.skippedMonitors.length}, Errors: ${result.errors.length}`;
    
    console.log('Sync completed:', result.message);
    
  } catch (error) {
    result.success = false;
    result.message = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(result.message);
    console.error('Sync failed:', error);
  }
  
  return result;
}

/**
 * Get sync status - shows what domains would be synced
 */
export async function getSyncStatus(): Promise<{
  operatingUnits: OperatingUnit[];
  domains: string[];
  existingMonitors: UptimeKumaMonitor[];
  domainsToAdd: string[];
  domainsToSkip: string[];
}> {
  try {
    const operatingUnits = await getOperatingUnits();
    const domains = extractDomains(operatingUnits);
    const existingMonitors = await getExistingMonitors();
    const existingUrls = new Set(existingMonitors.map(m => m.url));
    
    return {
      operatingUnits,
      domains,
      existingMonitors,
      domainsToAdd: domains.filter(domain => !existingUrls.has(domain)),
      domainsToSkip: domains.filter(domain => existingUrls.has(domain))
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    throw error;
  }
}
