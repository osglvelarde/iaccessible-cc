import { NextRequest, NextResponse } from 'next/server';
import { 
  OperatingUnit, 
  CreateOperatingUnitRequest, 
  UpdateOperatingUnitRequest, 
  OperatingUnitsResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';
import * as OperatingUnitModel from '@/lib/models/OperatingUnit';
import * as OrganizationModel from '@/lib/models/Organization';
import { validateOperatingUnitCreation, sanitizeString } from '@/lib/validation/users-roles';
import { mongoDBAuditLogger, getRequestMetadata } from '@/lib/mongodb-audit-logger';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminAuth } from '@/lib/auth-helpers';

// GET /api/users-roles/operating-units - List operating units with filtering and pagination
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
    const organization = searchParams.get('organization');
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');

    // Build MongoDB query
    const query: any = {};
    
    if (organizationId) {
      query.organizationId = organizationId;
    }
    
    if (organization) {
      query.organization = organization;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Try MongoDB-native pagination, fallback to model if it fails
    try {
      const db = await getDatabase();
      const collection = db.collection<OperatingUnit>('operatingUnits');
      
      // Get total count
      const total = await collection.countDocuments(query);
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;

      // Fetch paginated operating units
      const paginatedOperatingUnits = await collection
        .find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const response: OperatingUnitsResponse = {
        operatingUnits: paginatedOperatingUnits,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(response);
    } catch (dbError: any) {
      // Fallback to model-based approach if direct MongoDB access fails
      console.warn('Direct MongoDB access failed, using model fallback:', dbError?.message);
      
      const allOperatingUnits = await OperatingUnitModel.findOperatingUnits(query);
      
      // Pagination
      const total = allOperatingUnits.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOperatingUnits = allOperatingUnits.slice(startIndex, endIndex);

      const response: OperatingUnitsResponse = {
        operatingUnits: paginatedOperatingUnits,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(response);
    }
  } catch (error: any) {
    console.error('Error fetching operating units:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch operating units',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

// POST /api/users-roles/operating-units - Create new operating unit
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const ouData: CreateOperatingUnitRequest = await request.json();
    const metadata = getRequestMetadata(request);
    
    // Validate input
    const validation = validateOperatingUnitCreation(ouData);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Validate organization exists
    if (!ouData.organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const organization = await OrganizationModel.getOrganizationById(ouData.organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(ouData.name);
    // Extract domains from URLs if needed
    const { extractDomain } = await import('@/lib/validation/users-roles');
    const sanitizedDomains = ouData.domains.map(d => extractDomain(d.trim()));

    // Check if operating unit with same name already exists in this organization
    const existingOperatingUnits = await OperatingUnitModel.findOperatingUnits({ 
      name: sanitizedName,
      organizationId: ouData.organizationId
    });
    if (existingOperatingUnits.length > 0) {
      return NextResponse.json({ 
        error: 'Operating unit with this name already exists in this organization' 
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    const ouId = uuidv4();
    
    const newOperatingUnit: OperatingUnit = {
      id: ouId,
      organizationId: ouData.organizationId,
      name: sanitizedName,
      organization: sanitizeString(ouData.organization),
      domains: sanitizedDomains,
      description: ouData.description ? sanitizeString(ouData.description) : undefined,
      createdAt: now,
      updatedAt: now
    };

    await OperatingUnitModel.createOperatingUnit(newOperatingUnit);

    // Log audit entry (don't fail if audit logging fails)
    try {
      await mongoDBAuditLogger.logOperatingUnitAction(
        'operating_unit_created',
        ouId,
        ouData.organizationId,
        adminUser.id, // Use authenticated admin user's ID
        adminUser.email, // Use authenticated admin user's email
        { operatingUnitData: { from: null, to: { name: sanitizedName, organizationId: ouData.organizationId } } },
        metadata.ipAddress,
        metadata.userAgent
      );
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Continue - audit logging failure shouldn't break the operation
    }

    return NextResponse.json(newOperatingUnit, { status: 201 });
  } catch (error: any) {
    console.error('Error creating operating unit:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Operating unit with this name already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create operating unit',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT /api/users-roles/operating-units - Update operating unit
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const ouId = searchParams.get('ouId');
    
    if (!ouId) {
      return NextResponse.json({ error: 'ouId is required' }, { status: 400 });
    }

    const updateData: UpdateOperatingUnitRequest = await request.json();
    
    const updatedOU = await OperatingUnitModel.updateOperatingUnit(ouId, updateData);
    
    if (!updatedOU) {
      return NextResponse.json({ error: 'Operating unit not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedOU);
  } catch (error) {
    console.error('Error updating operating unit:', error);
    return NextResponse.json({ error: 'Failed to update operating unit' }, { status: 500 });
  }
}

// DELETE /api/users-roles/operating-units - Delete operating unit
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const ouId = searchParams.get('ouId');
    
    if (!ouId) {
      return NextResponse.json({ error: 'ouId is required' }, { status: 400 });
    }

    // TODO: Check if operating unit is in use by any users or groups
    // For now, we'll allow deletion
    
    const deleted = await OperatingUnitModel.deleteOperatingUnit(ouId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Operating unit not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operating unit:', error);
    return NextResponse.json({ error: 'Failed to delete operating unit' }, { status: 500 });
  }
}
