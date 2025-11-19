import { NextRequest, NextResponse } from 'next/server';
import { 
  UserGroup, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  GroupsResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';
import * as GroupModel from '@/lib/models/Group';

// GET /api/users-roles/groups - List groups with filtering and pagination
export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/users-roles/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const groupData: CreateGroupRequest = await request.json();
    
    // Validate required fields
    if (!groupData.name || !groupData.permissions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine scope and validate accordingly
    const isOrgLevelGroup = groupData.operatingUnitId === null || groupData.operatingUnitId === undefined;
    const scope = isOrgLevelGroup ? 'organization' : 'operating_unit';
    
    if (isOrgLevelGroup && !groupData.organizationId) {
      return NextResponse.json({ error: 'Organization ID is required for organization-level groups' }, { status: 400 });
    }
    
    if (!isOrgLevelGroup && !groupData.operatingUnitId) {
      return NextResponse.json({ error: 'Operating Unit ID is required for OU-level groups' }, { status: 400 });
    }

    // Check if group already exists in the same scope
    const existingGroups = await GroupModel.findGroups({
      name: groupData.name,
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
      name: groupData.name,
      type: 'custom',
      organizationId: groupData.organizationId || 'org-1',
      operatingUnitId: isOrgLevelGroup ? null : (groupData.operatingUnitId || null),
      scope: scope,
      permissions: groupData.permissions,
      description: groupData.description,
      isSystemGroup: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system' // TODO: Get from auth context
    };

    await GroupModel.createGroup(newGroup);

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// PUT /api/users-roles/groups - Update group
export async function PUT(request: NextRequest) {
  try {
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
