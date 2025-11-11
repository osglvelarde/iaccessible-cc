import { NextRequest, NextResponse } from 'next/server';
import { executePythonScript } from '@/lib/uptime-kuma-python';

/**
 * GET /api/uptime-kuma/monitor-beats?id=X&hours=Y - Get monitor beats (heartbeat history)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monitorId = searchParams.get('id');
    const hours = searchParams.get('hours') || '1';

    if (!monitorId) {
      return NextResponse.json(
        { success: false, error: 'Monitor ID is required' },
        { status: 400 }
      );
    }

    // Prepare data for Python script
    const scriptData = {
      id: parseInt(monitorId),
      hours: parseInt(hours),
    };

    console.log(`[monitor-beats] Executing Python script for monitor ${monitorId}, hours: ${hours}`);
    const startTime = Date.now();
    
    // Execute Python script to get monitor beats
    const result = await executePythonScript('get_monitor_beats', scriptData);
    
    const duration = Date.now() - startTime;
    console.log(`[monitor-beats] Python script completed for monitor ${monitorId} in ${duration}ms`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        beats: result.beats || [],
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch monitor beats',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching monitor beats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



