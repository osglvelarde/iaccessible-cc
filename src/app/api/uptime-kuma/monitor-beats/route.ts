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

    // Execute Python script to get monitor beats
    const result = await executePythonScript('get_monitor_beats', scriptData);

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



