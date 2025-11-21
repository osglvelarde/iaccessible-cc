import { NextRequest, NextResponse } from 'next/server';
import { 
  UserGroup, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  GroupsResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';
import * as GroupModel from '@/lib/models/Group';
import * as OrganizationModel from '@/lib/models/Organization';
import * as OperatingUnitModel from '@/lib/models/OperatingUnit';
import { validateGroupCreation, sanitizeString } from '@/lib/validation/users-roles';
import { mongoDBAuditLogger, getRequestMetadata } from '@/lib/mongodb-audit-logger';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminAuth } from '@/lib/auth-helpers';

// GET /api/users-roles/groups - List groups with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const operatingUnitId = searchParams.get('operatingUnitId');
    const organizationId = searchParams.get('organizationId');
    const scope = searchParams.get('scope') as 'organization' | 'operating_unit' | null;
    const type = searchParams.get('type') as string | null;
    const search = searchParams.get('search');

    // Build MongoDB query
    const query: any = {};
    
    if (operatingUnitId) {
      query.operatingUnitId = operatingUnitId;
    }
    
    if (organizationId) {
      query.organizationId = organizationId;
    }
    
    if (scope) {
      query.scope = scope;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Try MongoDB-native pagination, fallback to model if it fails
    try {
      const db = await getDatabase();
      const collection = db.collection<UserGroup>('groups');
      
      // Get total count
      const total = await collection.countDocuments(query);
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;

      // Fetch paginated groups
      const paginatedGroups = await collection
        .find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const response: GroupsResponse = {
        groups: paginatedGroups,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(response);
    } catch (dbError: any) {
      // Fallback to model-based approach if direct MongoDB access fails
      console.warn('Direct MongoDB access failed, using model fallback:', dbError?.message);
      
      const allGroups = await GroupModel.findGroups(query);
      
      // Pagination
      const total = allGroups.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGroups = allGroups.slice(startIndex, endIndex);

      const response: GroupsResponse = {
        groups: paginatedGroups,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(response);
    }
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch groups',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

// POST /api/users-roles/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const groupData: CreateGroupRequest = await request.json();
    const metadata = getRequestMetadata(request);
    
    // Validate input
    const validation = validateGroupCreation(groupData);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Validate organization exists
    const organization = await OrganizationModel.getOrganizationById(groupData.organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Determine scope and validate accordingly
    const isOrgLevelGroup = groupData.operatingUnitId === null || groupData.operatingUnitId === undefined;
    const scope = isOrgLevelGroup ? 'organization' : 'operating_unit';
    
    if (!isOrgLevelGroup && groupData.operatingUnitId) {
      // Validate operating unit exists and belongs to the organization
      const operatingUnit = await OperatingUnitModel.getOperatingUnitById(groupData.operatingUnitId);
      if (!operatingUnit) {
        return NextResponse.json({ error: 'Operating unit not found' }, { status: 404 });
      }
      if (operatingUnit.organizationId !== groupData.organizationId) {
        return NextResponse.json({ 
          error: 'Operating unit does not belong to the specified organization' 
        }, { status: 400 });
      }
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(groupData.name);

    // Check if group already exists in the same scope
    const existingGroups = await GroupModel.findGroups({
      name: sanitizedName,
      organizationId: groupData.organizationId,
      scope: scope
    });
    
    if (existingGroups.length > 0) {
      return NextResponse.json({ 
        error: `Group with this name already exists in the ${scope === 'organization' ? 'organization' : 'operating unit'}` 
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    const groupId = uuidv4();
    
    const newGroup: UserGroup = {
      id: groupId,
      name: sanitizedName,
      type: 'custom',
      organizationId: groupData.organizationId,
      operatingUnitId: isOrgLevelGroup ? null : (groupData.operatingUnitId || null),
      scope: scope,
      permissions: groupData.permissions,
      description: groupData.description ? sanitizeString(groupData.description) : undefined,
      isSystemGroup: false,
      createdAt: now,
      updatedAt: now,
      createdBy: adminUser.id // Use authenticated admin user's ID
    };

    await GroupModel.createGroup(newGroup);

    // Log audit entry (don't fail if audit logging fails)
    try {
      await mongoDBAuditLogger.logGroupAction(
        'group_created',
        groupId,
        groupData.organizationId,
        adminUser.id, // Use authenticated admin user's ID
        adminUser.email, // Use authenticated admin user's email
        { groupData: { from: null, to: { name: sanitizedName, scope, type: 'custom' } } },
        metadata.ipAddress,
        metadata.userAgent
      );
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Continue - audit logging failure shouldn't break the operation
    }

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Group with this name already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create group',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT /api/users-roles/groups - Update group
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    
    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const existingGroup = await GroupModel.getGroupById(groupId);
    
    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    // Prevent updating system groups
    if (existingGroup.isSystemGroup) {
      return NextResponse.json({ error: 'Cannot update system groups' }, { status: 403 });
    }

    const updateData: UpdateGroupRequest = await request.json();
    const updatedGroup = await GroupModel.updateGroup(groupId, updateData);
    
    if (!updatedGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/users-roles/groups - Delete group
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    
    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const existingGroup = await GroupModel.getGroupById(groupId);
    
    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    // Prevent deleting system groups
    if (existingGroup.isSystemGroup) {
      return NextResponse.json({ error: 'Cannot delete system groups' }, { status: 403 });
    }
    
    // TODO: Check if group is in use by any users
    // For now, we'll allow deletion
    
    const deleted = await GroupModel.deleteGroup(groupId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
