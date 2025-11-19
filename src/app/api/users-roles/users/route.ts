import { NextRequest, NextResponse } from 'next/server';
import { 
  User, 
  UserWithDetails, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UsersResponse,
  Organization,
  OperatingUnit,
  UserGroup,
  Permission
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';
import * as UserModel from '@/lib/models/User';
import * as GroupModel from '@/lib/models/Group';
import * as OperatingUnitModel from '@/lib/models/OperatingUnit';
import * as OrganizationModel from '@/lib/models/Organization';

// Helper function to enrich user with details
async function enrichUserWithDetails(user: User): Promise<UserWithDetails> {
  const [groups, operatingUnits, organizations] = await Promise.all([
    GroupModel.getAllGroups(),
    OperatingUnitModel.getAllOperatingUnits(),
    OrganizationModel.getAllOrganizations()
  ]);

  const userGroups = groups.filter(group => user.groupIds.includes(group.id));
  const operatingUnit = operatingUnits.find(ou => ou.id === user.operatingUnitId);
  const organization = operatingUnit ? organizations.find(org => org.id === operatingUnit.organizationId) : null;

  // Calculate effective permissions
  const effectivePermissions: Permission[] = [];
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
    operatingUnit: operatingUnit || { 
      id: user.operatingUnitId, 
      organizationId: 'org-1',
      name: 'Unknown', 
      organization: 'Unknown', 
      domains: [], 
      createdAt: '', 
      updatedAt: '' 
    },
    organization: organization || {
      id: 'org-1',
      name: 'Unknown Organization',
      slug: 'unknown',
      domains: [],
      settings: {
        allowCustomGroups: true,
        maxUsers: 100,
        maxOperatingUnits: 10,
        features: []
      },
      status: 'active',
      createdAt: '',
      updatedAt: '',
      createdBy: 'system'
    },
    groups: userGroups,
    effectivePermissions
  };
}

// GET /api/users-roles/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const operatingUnitId = searchParams.get('operatingUnitId');
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status') as string | null;
    const groupId = searchParams.get('groupId');
    const search = searchParams.get('search');

    // Build MongoDB query
    const query: any = {};
    
    if (operatingUnitId) {
      query.operatingUnitId = operatingUnitId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (groupId) {
      query.groupIds = groupId;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // If filtering by organization, we need to get operating units first
    if (organizationId) {
      const operatingUnits = await OperatingUnitModel.findOperatingUnits({ organizationId });
      const orgOperatingUnitIds = operatingUnits.map(ou => ou.id);
      query.operatingUnitId = { $in: orgOperatingUnitIds };
    }

    // Get all matching users
    const allUsers = await UserModel.findUsers(query);
    
    // Total count for pagination
    const total = allUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

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
    const userData: CreateUserRequest = await request.json();
    
    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.operatingUnitId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await UserModel.getUserByEmail(userData.email);
    if (existingUser) {
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

    await UserModel.createUser(newUser);

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updateData: UpdateUserRequest = await request.json();
    
    const updatedUser = await UserModel.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return enriched user
    const enrichedUser = await enrichUserWithDetails(updatedUser);
    return NextResponse.json(enrichedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users-roles/users - Deactivate user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Soft delete - just change status to inactive
    const updatedUser = await UserModel.updateUser(userId, { status: 'inactive' });
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
