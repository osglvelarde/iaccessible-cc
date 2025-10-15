import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  User, 
  UserWithDetails, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters,
  UsersResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'users-roles-data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const GROUPS_DIR = path.join(DATA_DIR, 'groups');
const OPERATING_UNITS_DIR = path.join(DATA_DIR, 'operating-units');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(USERS_DIR, { recursive: true });
    await fs.mkdir(GROUPS_DIR, { recursive: true });
    await fs.mkdir(OPERATING_UNITS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Helper function to load all users
async function loadAllUsers(): Promise<User[]> {
  try {
    const files = await fs.readdir(USERS_DIR);
    const userFiles = files.filter(file => file.endsWith('.json'));
    
    const users: User[] = [];
    for (const file of userFiles) {
      try {
        const filePath = path.join(USERS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const user: User = JSON.parse(fileContent);
        users.push(user);
      } catch (error) {
        console.error(`Error reading user file ${file}:`, error);
      }
    }
    
    return users;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

// Helper function to load all groups
async function loadAllGroups() {
  try {
    const files = await fs.readdir(GROUPS_DIR);
    const groupFiles = files.filter(file => file.endsWith('.json'));
    
    const groups = [];
    for (const file of groupFiles) {
      try {
        const filePath = path.join(GROUPS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const group = JSON.parse(fileContent);
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

// Helper function to load all operating units
async function loadAllOperatingUnits() {
  try {
    const files = await fs.readdir(OPERATING_UNITS_DIR);
    const ouFiles = files.filter(file => file.endsWith('.json'));
    
    const operatingUnits = [];
    for (const file of ouFiles) {
      try {
        const filePath = path.join(OPERATING_UNITS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const ou = JSON.parse(fileContent);
        operatingUnits.push(ou);
      } catch (error) {
        console.error(`Error reading operating unit file ${file}:`, error);
      }
    }
    
    return operatingUnits;
  } catch (error) {
    console.error('Error loading operating units:', error);
    return [];
  }
}

// Helper function to enrich user with details
async function enrichUserWithDetails(user: User): Promise<UserWithDetails> {
  const [groups, operatingUnits] = await Promise.all([
    loadAllGroups(),
    loadAllOperatingUnits()
  ]);

  const userGroups = groups.filter(group => user.groupIds.includes(group.id));
  const operatingUnit = operatingUnits.find(ou => ou.id === user.operatingUnitId);

  // Calculate effective permissions
  const effectivePermissions = [];
  for (const group of userGroups) {
    for (const modulePermission of group.permissions) {
      for (const feature of modulePermission.features) {
        effectivePermissions.push({
          id: `${user.id}-${group.id}-${modulePermission.moduleKey}-${feature.featureKey}`,
          moduleKey: modulePermission.moduleKey,
          accessLevel: feature.accessLevel,
          features: [feature],
          grantedBy: 'group' as const,
          grantedById: group.id
        });
      }
    }
  }

  return {
    ...user,
    operatingUnit: operatingUnit || { id: user.operatingUnitId, name: 'Unknown', organization: 'Unknown', domains: [], createdAt: '', updatedAt: '' },
    groups: userGroups,
    effectivePermissions
  };
}

// GET /api/users-roles/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const operatingUnitId = searchParams.get('operatingUnitId');
    const status = searchParams.get('status') as any;
    const groupId = searchParams.get('groupId');
    const search = searchParams.get('search');

    const allUsers = await loadAllUsers();
    
    // Apply filters
    let filteredUsers = allUsers;
    
    if (operatingUnitId) {
      filteredUsers = filteredUsers.filter(user => user.operatingUnitId === operatingUnitId);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    if (groupId) {
      filteredUsers = filteredUsers.filter(user => user.groupIds.includes(groupId));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Enrich users with details
    const enrichedUsers = await Promise.all(
      paginatedUsers.map(user => enrichUserWithDetails(user))
    );

    const response: UsersResponse = {
      users: enrichedUsers,
      total,
      page,
      pageSize,
      totalPages
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users-roles/users - Create new user
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const userData: CreateUserRequest = await request.json();
    
    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.operatingUnitId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await loadAllUsers();
    if (existingUsers.some(user => user.email === userData.email)) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const userId = uuidv4();
    
    const newUser: User = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      operatingUnitId: userData.operatingUnitId,
      groupIds: userData.groupIds || [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system', // TODO: Get from auth context
      invitedBy: userData.sendInvitation ? 'system' : undefined,
      invitationToken: userData.sendInvitation ? uuidv4() : undefined,
      invitationExpiresAt: userData.sendInvitation ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
    };

    const filePath = path.join(USERS_DIR, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(newUser, null, 2));

    // Return enriched user
    const enrichedUser = await enrichUserWithDetails(newUser);
    return NextResponse.json(enrichedUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT /api/users-roles/users - Update user
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updateData: UpdateUserRequest = await request.json();
    
    const filePath = path.join(USERS_DIR, `${userId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const existingUser: User = JSON.parse(fileContent);
      
      const updatedUser: User = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(updatedUser, null, 2));
      
      // Return enriched user
      const enrichedUser = await enrichUserWithDetails(updatedUser);
      return NextResponse.json(enrichedUser);
    } catch (fileError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users-roles/users - Deactivate user
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const filePath = path.join(USERS_DIR, `${userId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const existingUser: User = JSON.parse(fileContent);
      
      // Soft delete - just change status to inactive
      const updatedUser: User = {
        ...existingUser,
        status: 'inactive',
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(updatedUser, null, 2));
      
      return NextResponse.json({ success: true });
    } catch (fileError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
