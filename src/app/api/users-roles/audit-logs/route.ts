import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit-logger';

// GET /api/users-roles/audit-logs - Get audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      organizationId: searchParams.get('organizationId') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      action: searchParams.get('action') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined
    };

    const response = await auditLogger.getAuditLogs(filters);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// POST /api/users-roles/audit-logs - Create audit log entry (for testing)
export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    const {
      action,
      resourceType,
      resourceId,
      organizationId,
      actorId,
      actorEmail,
      changes,
      ipAddress,
      userAgent
    } = logData;

    // Validate required fields
    if (!action || !resourceType || !resourceId || !organizationId || !actorId || !actorEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, resourceType, resourceId, organizationId, actorId, actorEmail' 
      }, { status: 400 });
    }

    await auditLogger.log(
      action,
      resourceType,
      resourceId,
      organizationId,
      actorId,
      actorEmail,
      changes,
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
