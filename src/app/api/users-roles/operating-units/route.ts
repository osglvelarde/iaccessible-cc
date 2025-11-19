import { NextRequest, NextResponse } from 'next/server';
import { 
  OperatingUnit, 
  CreateOperatingUnitRequest, 
  UpdateOperatingUnitRequest, 
  OperatingUnitsResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';
import * as OperatingUnitModel from '@/lib/models/OperatingUnit';

// GET /api/users-roles/operating-units - List operating units with filtering and pagination
export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error fetching operating units:', error);
    return NextResponse.json({ error: 'Failed to fetch operating units' }, { status: 500 });
  }
}

// POST /api/users-roles/operating-units - Create new operating unit
export async function POST(request: NextRequest) {
  try {
    const ouData: CreateOperatingUnitRequest = await request.json();
    
    // Validate required fields
    if (!ouData.name || !ouData.organization || !ouData.domains || ouData.domains.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TODO: Validate organizationId exists (in production, check against organizations table)
    // For now, we'll assume organizationId is provided and valid

    // Check if operating unit already exists
    const existingOperatingUnits = await OperatingUnitModel.findOperatingUnits({ name: ouData.name });
    if (existingOperatingUnits.length > 0) {
      return NextResponse.json({ error: 'Operating unit with this name already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const ouId = uuidv4();
    
    const newOperatingUnit: OperatingUnit = {
      id: ouId,
      organizationId: ouData.organizationId || 'org-1',
      name: ouData.name,
      organization: ouData.organization,
      domains: ouData.domains,
      description: ouData.description,
      createdAt: now,
      updatedAt: now
    };

    await OperatingUnitModel.createOperatingUnit(newOperatingUnit);

    return NextResponse.json(newOperatingUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating operating unit:', error);
    return NextResponse.json({ error: 'Failed to create operating unit' }, { status: 500 });
  }
}

// PUT /api/users-roles/operating-units - Update operating unit
export async function PUT(request: NextRequest) {
  try {
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
