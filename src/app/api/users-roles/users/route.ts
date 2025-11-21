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
import { validateUserCreation, sanitizeEmail, sanitizeString } from '@/lib/validation/users-roles';
import { mongoDBAuditLogger, getRequestMetadata } from '@/lib/mongodb-audit-logger';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminAuth } from '@/lib/auth-helpers';

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
    // Debug: Log incoming request
    if (process.env.NODE_ENV === 'development') {
      console.log('[API GET /users] Request headers:', Object.fromEntries(request.headers.entries()));
      console.log('[API GET /users] x-user-id header:', request.headers.get('x-user-id'));
    }
    
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API GET /users] Auth failed:', authResult.response.status);
      }
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100); // Max 100 per page
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
      if (orgOperatingUnitIds.length > 0) {
        query.operatingUnitId = { $in: orgOperatingUnitIds };
      } else {
        // No operating units in this org, return empty result
        return NextResponse.json({
          users: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        });
      }
    }

    // Try MongoDB-native pagination, fallback to model if it fails
    try {
      const db = await getDatabase();
      const collection = db.collection<User>('users');
      
      // Get total count
      const total = await collection.countDocuments(query);
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;

      // Fetch paginated users
      const paginatedUsers = await collection
        .find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(pageSize)
        .toArray();

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
    } catch (dbError: any) {
      // Fallback to model-based approach if direct MongoDB access fails
      console.warn('Direct MongoDB access failed, using model fallback:', dbError?.message);
      
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
    }
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

// POST /api/users-roles/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const userData: CreateUserRequest = await request.json();
    const metadata = getRequestMetadata(request);
    
    // Validate input
    const validation = validateUserCreation(userData);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(userData.email);
    const sanitizedFirstName = sanitizeString(userData.firstName);
    const sanitizedLastName = sanitizeString(userData.lastName);

    // Check if user already exists
    const existingUser = await UserModel.getUserByEmail(sanitizedEmail);
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 });
    }

    // Validate operating unit exists
    const operatingUnit = await OperatingUnitModel.getOperatingUnitById(userData.operatingUnitId);
    if (!operatingUnit) {
      return NextResponse.json({ 
        error: 'Operating unit not found' 
      }, { status: 404 });
    }

    // Validate groups exist and belong to the same organization
    if (userData.groupIds && userData.groupIds.length > 0) {
      const allGroups = await GroupModel.getAllGroups();
      const requestedGroups = allGroups.filter(g => userData.groupIds!.includes(g.id));
      
      if (requestedGroups.length !== userData.groupIds.length) {
        return NextResponse.json({ 
          error: 'One or more groups not found' 
        }, { status: 404 });
      }

      // Check if groups belong to the same organization as the operating unit
      const invalidGroups = requestedGroups.filter(g => 
        g.organizationId !== operatingUnit.organizationId
      );
      
      if (invalidGroups.length > 0) {
        return NextResponse.json({ 
          error: 'Groups must belong to the same organization as the operating unit' 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const userId = uuidv4();
    
    const newUser: User = {
      id: userId,
      email: sanitizedEmail,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      operatingUnitId: userData.operatingUnitId,
      groupIds: userData.groupIds || [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      createdBy: adminUser.id, // Use authenticated admin user's ID
      invitedBy: userData.sendInvitation ? adminUser.id : undefined,
      invitationToken: userData.sendInvitation ? uuidv4() : undefined,
      invitationExpiresAt: userData.sendInvitation ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
    };

    await UserModel.createUser(newUser);

    // Log audit entry (don't fail if audit logging fails)
    try {
      await mongoDBAuditLogger.logUserAction(
        'user_created',
        userId,
        operatingUnit.organizationId,
        adminUser.id, // Use authenticated admin user's ID
        adminUser.email, // Use authenticated admin user's email
        { userData: { from: null, to: { email: sanitizedEmail, firstName: sanitizedFirstName, lastName: sanitizedLastName } } },
        metadata.ipAddress,
        metadata.userAgent
      );
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Continue - audit logging failure shouldn't break the operation
    }

    // Return enriched user
    const enrichedUser = await enrichUserWithDetails(newUser);
    return NextResponse.json(enrichedUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT /api/users-roles/users - Update user
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const metadata = getRequestMetadata(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get existing user to track changes
    const existingUser = await UserModel.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: UpdateUserRequest = await request.json();
    
    // Validate and sanitize updates
    if (updateData.firstName) {
      updateData.firstName = sanitizeString(updateData.firstName);
      if (updateData.firstName.length < 2) {
        return NextResponse.json({ error: 'First name must be at least 2 characters' }, { status: 400 });
      }
    }
    
    if (updateData.lastName) {
      updateData.lastName = sanitizeString(updateData.lastName);
      if (updateData.lastName.length < 2) {
        return NextResponse.json({ error: 'Last name must be at least 2 characters' }, { status: 400 });
      }
    }

    // Validate operating unit if being changed
    if (updateData.operatingUnitId && updateData.operatingUnitId !== existingUser.operatingUnitId) {
      const operatingUnit = await OperatingUnitModel.getOperatingUnitById(updateData.operatingUnitId);
      if (!operatingUnit) {
        return NextResponse.json({ error: 'Operating unit not found' }, { status: 404 });
      }
    }

    // Validate groups if being changed
    if (updateData.groupIds) {
      const allGroups = await GroupModel.getAllGroups();
      const requestedGroups = allGroups.filter(g => updateData.groupIds!.includes(g.id));
      
      if (requestedGroups.length !== updateData.groupIds.length) {
        return NextResponse.json({ error: 'One or more groups not found' }, { status: 404 });
      }
    }

    const updatedUser = await UserModel.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Track changes for audit log
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (updateData.firstName && updateData.firstName !== existingUser.firstName) {
      changes.firstName = { from: existingUser.firstName, to: updateData.firstName };
    }
    if (updateData.lastName && updateData.lastName !== existingUser.lastName) {
      changes.lastName = { from: existingUser.lastName, to: updateData.lastName };
    }
    if (updateData.operatingUnitId && updateData.operatingUnitId !== existingUser.operatingUnitId) {
      changes.operatingUnitId = { from: existingUser.operatingUnitId, to: updateData.operatingUnitId };
    }
    if (updateData.status && updateData.status !== existingUser.status) {
      changes.status = { from: existingUser.status, to: updateData.status };
    }
    if (updateData.groupIds) {
      changes.groupIds = { from: existingUser.groupIds, to: updateData.groupIds };
    }

    // Get organization ID for audit log
    const operatingUnit = await OperatingUnitModel.getOperatingUnitById(updatedUser.operatingUnitId);
    const organizationId = operatingUnit?.organizationId || 'unknown';

    // Log audit entry (don't fail if audit logging fails)
    if (Object.keys(changes).length > 0) {
      try {
        await mongoDBAuditLogger.logUserAction(
          'user_updated',
          userId,
          organizationId,
          adminUser.id, // Use authenticated admin user's ID
          adminUser.email, // Use authenticated admin user's email
          changes,
          metadata.ipAddress,
          metadata.userAgent
        );
      } catch (auditError) {
        console.warn('Failed to log audit entry:', auditError);
        // Continue - audit logging failure shouldn't break the operation
      }
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
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const metadata = getRequestMetadata(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get existing user for audit log
    const existingUser = await UserModel.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization ID for audit log
    const operatingUnit = await OperatingUnitModel.getOperatingUnitById(existingUser.operatingUnitId);
    const organizationId = operatingUnit?.organizationId || 'unknown';

    // Soft delete - just change status to inactive
    const updatedUser = await UserModel.updateUser(userId, { status: 'inactive' });
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log audit entry (don't fail if audit logging fails)
    try {
      await mongoDBAuditLogger.logUserAction(
        'user_deactivated',
        userId,
        organizationId,
        adminUser.id, // Use authenticated admin user's ID
        adminUser.email, // Use authenticated admin user's email
        { status: { from: existingUser.status, to: 'inactive' } },
        metadata.ipAddress,
        metadata.userAgent
      );
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Continue - audit logging failure shouldn't break the operation
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
