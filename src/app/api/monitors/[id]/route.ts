import { NextRequest, NextResponse } from 'next/server';
import { kumaClient } from '@/lib/kumaClient';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement proper server-side authentication
    // For now, skip permission checks in development
    // if (!checkModuleAccess(mockUser, 'uptimeMonitoring')) {
    //   return NextResponse.json(
    //     { error: 'Access denied. Insufficient permissions for uptime monitoring.' },
    //     { status: 403 }
    //   );
    // }

    const monitorId = parseInt(params.id);
    if (isNaN(monitorId)) {
      return NextResponse.json(
        { error: 'Invalid monitor ID' },
        { status: 400 }
      );
    }

    const result = await kumaClient.getMonitor(monitorId);
    
    if (!result.ok) {
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { error: 'Monitor not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: result.error || 'Failed to fetch monitor' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching monitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement proper server-side authentication
    // For now, skip permission checks in development
    // if (!checkModuleAccess(mockUser, 'uptimeMonitoring')) {
    //   return NextResponse.json(
    //     { error: 'Access denied. Insufficient permissions for uptime monitoring.' },
    //     { status: 403 }
    //   );
    // }

    const monitorId = parseInt(params.id);
    if (isNaN(monitorId)) {
      return NextResponse.json(
        { error: 'Invalid monitor ID' },
        { status: 400 }
      );
    }

    const result = await kumaClient.deleteMonitor(monitorId);
    
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete monitor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
