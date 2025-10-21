import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit-logger';

// GET /api/users-roles/audit-logs/statistics - Get audit log statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const statistics = await auditLogger.getAuditStatistics(organizationId);
    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch audit statistics' }, { status: 500 });
  }
}
