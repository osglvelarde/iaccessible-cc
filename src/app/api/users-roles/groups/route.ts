import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  UserGroup, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  GroupFilters,
  GroupsResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'users-roles-data');
const GROUPS_DIR = path.join(DATA_DIR, 'groups');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(GROUPS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Helper function to load all groups
async function loadAllGroups(): Promise<UserGroup[]> {
  try {
    const files = await fs.readdir(GROUPS_DIR);
    const groupFiles = files.filter(file => file.endsWith('.json'));
    
    const groups: UserGroup[] = [];
    for (const file of groupFiles) {
      try {
        const filePath = path.join(GROUPS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const group: UserGroup = JSON.parse(fileContent);
        groups.push(group);
      } catch (error) {
        console.error(`Error reading group file ${file}:`, error);
      }
    }
    
    return groups;
  } catch (error) {
    console.error('Error loading groups:', error);
    return [];
  }
}

// GET /api/users-roles/groups - List groups with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const operatingUnitId = searchParams.get('operatingUnitId');
    const type = searchParams.get('type') as string | null;
    const search = searchParams.get('search');

    const allGroups = await loadAllGroups();
    
    // Apply filters
    let filteredGroups = allGroups;
    
    if (operatingUnitId) {
      filteredGroups = filteredGroups.filter(group => group.operatingUnitId === operatingUnitId);
    }
    
    if (type) {
      filteredGroups = filteredGroups.filter(group => group.type === type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGroups = filteredGroups.filter(group => 
        group.name.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const total = filteredGroups.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedGroups = filteredGroups.slice(startIndex, endIndex);

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
    await ensureDirectories();
    
    const groupData: CreateGroupRequest = await request.json();
    
    // Validate required fields
    if (!groupData.name || !groupData.operatingUnitId || !groupData.permissions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if group already exists in the same operating unit
    const existingGroups = await loadAllGroups();
    if (existingGroups.some(group => 
      group.name === groupData.name && group.operatingUnitId === groupData.operatingUnitId
    )) {
      return NextResponse.json({ error: 'Group with this name already exists in the operating unit' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const groupId = uuidv4();
    
    const newGroup: UserGroup = {
      id: groupId,
      name: groupData.name,
      type: 'custom',
      operatingUnitId: groupData.operatingUnitId,
      permissions: groupData.permissions,
      description: groupData.description,
      isSystemGroup: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system' // TODO: Get from auth context
    };

    const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
    await fs.writeFile(filePath, JSON.stringify(newGroup, null, 2));

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// PUT /api/users-roles/groups - Update group
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    
    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const updateData: UpdateGroupRequest = await request.json();
    
    const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const existingGroup: UserGroup = JSON.parse(fileContent);
      
      // Prevent updating system groups
      if (existingGroup.isSystemGroup) {
        return NextResponse.json({ error: 'Cannot update system groups' }, { status: 403 });
      }
      
      const updatedGroup: UserGroup = {
        ...existingGroup,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(updatedGroup, null, 2));
      
      return NextResponse.json(updatedGroup);
    } catch (fileError) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/users-roles/groups - Delete group
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    
    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const filePath = path.join(GROUPS_DIR, `${groupId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const existingGroup: UserGroup = JSON.parse(fileContent);
      
      // Prevent deleting system groups
      if (existingGroup.isSystemGroup) {
        return NextResponse.json({ error: 'Cannot delete system groups' }, { status: 403 });
      }
      
      // TODO: Check if group is in use by any users
      // For now, we'll allow deletion
      
      await fs.unlink(filePath);
      
      return NextResponse.json({ success: true });
    } catch (fileError) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
