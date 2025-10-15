import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  OperatingUnit, 
  CreateOperatingUnitRequest, 
  UpdateOperatingUnitRequest, 
  OperatingUnitFilters,
  OperatingUnitsResponse 
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'users-roles-data');
const OPERATING_UNITS_DIR = path.join(DATA_DIR, 'operating-units');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(OPERATING_UNITS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Helper function to load all operating units
async function loadAllOperatingUnits(): Promise<OperatingUnit[]> {
  try {
    const files = await fs.readdir(OPERATING_UNITS_DIR);
    const ouFiles = files.filter(file => file.endsWith('.json'));
    
    const operatingUnits: OperatingUnit[] = [];
    for (const file of ouFiles) {
      try {
        const filePath = path.join(OPERATING_UNITS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const ou: OperatingUnit = JSON.parse(fileContent);
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

// GET /api/users-roles/operating-units - List operating units with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const organization = searchParams.get('organization');
    const search = searchParams.get('search');

    const allOperatingUnits = await loadAllOperatingUnits();
    
    // Apply filters
    let filteredOperatingUnits = allOperatingUnits;
    
    if (organization) {
      filteredOperatingUnits = filteredOperatingUnits.filter(ou => ou.organization === organization);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOperatingUnits = filteredOperatingUnits.filter(ou => 
        ou.name.toLowerCase().includes(searchLower) ||
        ou.organization.toLowerCase().includes(searchLower) ||
        (ou.description && ou.description.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const total = filteredOperatingUnits.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOperatingUnits = filteredOperatingUnits.slice(startIndex, endIndex);

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
    await ensureDirectories();
    
    const ouData: CreateOperatingUnitRequest = await request.json();
    
    // Validate required fields
    if (!ouData.name || !ouData.organization || !ouData.domains || ouData.domains.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if operating unit already exists
    const existingOperatingUnits = await loadAllOperatingUnits();
    if (existingOperatingUnits.some(ou => ou.name === ouData.name)) {
      return NextResponse.json({ error: 'Operating unit with this name already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const ouId = uuidv4();
    
    const newOperatingUnit: OperatingUnit = {
      id: ouId,
      name: ouData.name,
      organization: ouData.organization,
      domains: ouData.domains,
      description: ouData.description,
      createdAt: now,
      updatedAt: now
    };

    const filePath = path.join(OPERATING_UNITS_DIR, `${ouId}.json`);
    await fs.writeFile(filePath, JSON.stringify(newOperatingUnit, null, 2));

    return NextResponse.json(newOperatingUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating operating unit:', error);
    return NextResponse.json({ error: 'Failed to create operating unit' }, { status: 500 });
  }
}

// PUT /api/users-roles/operating-units - Update operating unit
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const ouId = searchParams.get('ouId');
    
    if (!ouId) {
      return NextResponse.json({ error: 'ouId is required' }, { status: 400 });
    }

    const updateData: UpdateOperatingUnitRequest = await request.json();
    
    const filePath = path.join(OPERATING_UNITS_DIR, `${ouId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const existingOU: OperatingUnit = JSON.parse(fileContent);
      
      const updatedOU: OperatingUnit = {
        ...existingOU,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(updatedOU, null, 2));
      
      return NextResponse.json(updatedOU);
    } catch (fileError) {
      return NextResponse.json({ error: 'Operating unit not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating operating unit:', error);
    return NextResponse.json({ error: 'Failed to update operating unit' }, { status: 500 });
  }
}

// DELETE /api/users-roles/operating-units - Delete operating unit
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const ouId = searchParams.get('ouId');
    
    if (!ouId) {
      return NextResponse.json({ error: 'ouId is required' }, { status: 400 });
    }

    const filePath = path.join(OPERATING_UNITS_DIR, `${ouId}.json`);
    
    try {
      // TODO: Check if operating unit is in use by any users or groups
      // For now, we'll allow deletion
      
      await fs.unlink(filePath);
      
      return NextResponse.json({ success: true });
    } catch (fileError) {
      return NextResponse.json({ error: 'Operating unit not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting operating unit:', error);
    return NextResponse.json({ error: 'Failed to delete operating unit' }, { status: 500 });
  }
}
