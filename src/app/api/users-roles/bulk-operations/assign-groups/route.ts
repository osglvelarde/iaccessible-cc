import { NextRequest, NextResponse } from 'next/server';
import { bulkOperationsManager } from '@/lib/bulk-operations';

// POST /api/users-roles/bulk-operations/assign-groups - Bulk assign users to groups
export async function POST(request: NextRequest) {
  try {
    const {
      userIds,
      groupIds,
      organizationId,
      actorId,
      actorEmail
    } = await request.json();

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
    }

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json({ error: 'groupIds array is required' }, { status: 400 });
    }

    if (!organizationId || !actorId || !actorEmail) {
      return NextResponse.json({ 
        error: 'organizationId, actorId, and actorEmail are required' 
      }, { status: 400 });
    }

    // Perform bulk group assignment
    const results = await bulkOperationsManager.bulkAssignUsersToGroups(
      userIds,
      groupIds,
      organizationId,
      actorId,
      actorEmail
    );

    return NextResponse.json({
      success: true,
      totalUsers: userIds.length,
      successfulAssignments: results.success,
      failedAssignments: results.errors.length,
      errors: results.errors
    });
  } catch (error) {
    console.error('Error in bulk group assignment:', error);
    return NextResponse.json({ error: 'Failed to assign groups' }, { status: 500 });
  }
}
