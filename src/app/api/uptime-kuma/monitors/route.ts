import { NextRequest, NextResponse } from 'next/server';
import { executePythonScript } from '@/lib/uptime-kuma-python';

/**
 * POST /api/uptime-kuma/monitors - Create a new monitor
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.url || !data.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, url, type' },
        { status: 400 }
      );
    }

    // Prepare monitor data for Python script
    const monitorData = {
      name: data.name,
      url: data.url,
      type: data.type || 'https',
      heartbeatInterval: data.heartbeatInterval || 60,
      retries: data.retries || 0,
      heartbeatRetryInterval: data.heartbeatRetryInterval || 60,
      requestTimeout: data.requestTimeout || 48,
      httpMethod: data.httpMethod || data.method || 'GET',
      bodyEncoding: data.bodyEncoding || 'JSON',
      body: data.body || '',
      keyword: data.keyword || '',
      expectedStatusCode: data.expectedStatusCode || 200,
      maxredirects: data.maxredirects || 10,
      ignoredKeywords: Array.isArray(data.ignoredKeywords) ? data.ignoredKeywords : [],
      headers: Array.isArray(data.headers) ? data.headers : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      notificationIDList: Array.isArray(data.notificationIDList) ? data.notificationIDList : [],
      acceptedStatusCodes: Array.isArray(data.acceptedStatusCodes) ? data.acceptedStatusCodes : ["200-299"],
      authMethod: data.authMethod || 'none',
      pushToken: data.pushToken || '',
    };

    // Execute Python script to create monitor
    const result = await executePythonScript('add_monitor', monitorData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        monitorID: result.monitorID,
        message: result.message || 'Monitor created successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create monitor',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating monitor:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/uptime-kuma/monitors?id=X - Update a monitor
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monitorId = searchParams.get('id');
    const data = await request.json();

    if (!monitorId) {
      return NextResponse.json(
        { success: false, error: 'Monitor ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data for Python script
    // The Python script will fetch existing monitor and merge
    const updateData = {
      id: parseInt(monitorId),
      ...data, // Include all fields from request
    };

    // Execute Python script to update monitor
    const result = await executePythonScript('update_monitor', updateData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        monitorID: result.monitorID || parseInt(monitorId),
        message: result.message || 'Monitor updated successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update monitor',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating monitor:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/uptime-kuma/monitors?id=X - Delete a monitor
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monitorId = searchParams.get('id');

    if (!monitorId) {
      return NextResponse.json(
        { success: false, error: 'Monitor ID is required' },
        { status: 400 }
      );
    }

    // Execute Python script to delete monitor
    const result = await executePythonScript('delete_monitor', { id: parseInt(monitorId) });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Monitor deleted successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to delete monitor',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
