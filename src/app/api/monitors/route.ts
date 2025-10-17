import { NextRequest, NextResponse } from 'next/server';
import { getSocket, getMonitors as getKumaMonitors } from '@/lib/kumaSocket';
import { CreateMonitorRequest, MonitorListResponse } from '@/lib/types/monitoring';
import { checkModuleAccess } from '@/lib/users-roles-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mock user for now - in production this would come from auth middleware
const mockUser = {
  id: '1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  operatingUnitId: '1',
  groupIds: ['1'],
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  operatingUnit: {
    id: '1',
    name: 'Default OU',
    organization: 'Default Org',
    domains: ['example.com'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  groups: [{
    id: '1',
    name: 'Global Admin',
    type: 'predefined' as const,
    roleType: 'global_admin' as const,
    operatingUnitId: '1',
    permissions: [],
    isSystemGroup: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  }],
  effectivePermissions: []
};

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/monitors - Starting request');
    
    // TODO: Implement proper server-side authentication
    // For now, skip permission checks in development
    // if (!checkModuleAccess(mockUser, 'uptimeMonitoring')) {
    //   return NextResponse.json(
    //     { error: 'Access denied. Insufficient permissions for uptime monitoring.' },
    //     { status: 403 }
    //   );
    // }

    console.log('GET /api/monitors - Calling getKumaMonitors()');
    const kumaMonitors = await getKumaMonitors();
    console.log('GET /api/monitors - Result:', kumaMonitors);
    
    const response: MonitorListResponse = {
      monitors: kumaMonitors || [],
      total: kumaMonitors?.length || 0
    };

    console.log('GET /api/monitors - Returning response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper server-side authentication
    // For now, skip permission checks in development
    // if (!checkModuleAccess(mockUser, 'uptimeMonitoring')) {
    //   return NextResponse.json(
    //     { error: 'Access denied. Insufficient permissions for uptime monitoring.' },
    //     { status: 403 }
    //   );
    // }

    const { name, url, method = 'GET', interval = 60 } = await request.json();
    
    // Validate required fields
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const payload = {
      type: 'http',
      name,
      url,
      method,
      interval,
      maxretries: 0,
      retryInterval: 60,
      ignoreTls: false,
      upsideDown: false,
      notificationIDList: [],
    };

    console.log('POST /api/monitors - Creating monitor with payload:', payload);

    const socket = await getSocket();
    const result = await new Promise((resolve, reject) => {
      socket.emit('add', payload, (res: any) => {
        if (res === true || res?.ok) {
          console.log('POST /api/monitors - Monitor created successfully:', res);
          resolve(res);
        } else {
          console.error('POST /api/monitors - Monitor creation failed:', res);
          reject(new Error(res?.msg || 'Failed to create monitor'));
        }
      });
    });

    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error) {
    console.error('Error creating monitor:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
