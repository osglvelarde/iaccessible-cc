import { NextResponse } from 'next/server';
import { syncOperatingUnitDomains, getSyncStatus } from '@/lib/uptime-sync-service';

/**
 * GET /api/uptime-kuma/sync - Get sync status (what would be synced)
 */
export async function GET() {
  try {
    const status = await getSyncStatus();
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/uptime-kuma/sync - Perform domain sync
 */
export async function POST() {
  try {
    const result = await syncOperatingUnitDomains();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing domains:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

