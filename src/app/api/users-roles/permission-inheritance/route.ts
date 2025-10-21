import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  PermissionInheritanceConfig,
  PermissionInheritanceRule,
  CreateInheritanceRuleRequest,
  UpdateInheritanceRuleRequest
} from '@/lib/types/users-roles';
import { permissionInheritanceManager } from '@/lib/permission-inheritance';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'users-roles-data');
const INHERITANCE_DIR = path.join(DATA_DIR, 'permission-inheritance');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(INHERITANCE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Helper function to load inheritance config for organization
async function loadInheritanceConfig(organizationId: string): Promise<PermissionInheritanceConfig | null> {
  try {
    const filePath = path.join(INHERITANCE_DIR, `${organizationId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return null;
  }
}

// Helper function to save inheritance config
async function saveInheritanceConfig(config: PermissionInheritanceConfig): Promise<void> {
  const filePath = path.join(INHERITANCE_DIR, `${config.organizationId}.json`);
  await fs.writeFile(filePath, JSON.stringify(config, null, 2));
}

// GET /api/users-roles/permission-inheritance - Get inheritance config for organization
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    let config = await loadInheritanceConfig(organizationId);
    
    // Create default config if none exists
    if (!config) {
      config = permissionInheritanceManager.createDefaultInheritanceConfig(organizationId);
      await saveInheritanceConfig(config);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching inheritance config:', error);
    return NextResponse.json({ error: 'Failed to fetch inheritance config' }, { status: 500 });
  }
}

// POST /api/users-roles/permission-inheritance - Create or update inheritance config
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const configData: Partial<PermissionInheritanceConfig> = await request.json();
    
    if (!configData.organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const existingConfig = await loadInheritanceConfig(configData.organizationId);
    
    const config: PermissionInheritanceConfig = {
      organizationId: configData.organizationId,
      enableInheritance: configData.enableInheritance ?? true,
      defaultInheritanceLevel: configData.defaultInheritanceLevel ?? 'partial',
      rules: configData.rules ?? [],
      createdAt: existingConfig?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate configuration
    const errors = permissionInheritanceManager.validateInheritanceConfig(config);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Invalid configuration', details: errors }, { status: 400 });
    }

    await saveInheritanceConfig(config);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error saving inheritance config:', error);
    return NextResponse.json({ error: 'Failed to save inheritance config' }, { status: 500 });
  }
}

// PUT /api/users-roles/permission-inheritance - Update inheritance config
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const updateData: Partial<PermissionInheritanceConfig> = await request.json();
    
    const existingConfig = await loadInheritanceConfig(organizationId);
    if (!existingConfig) {
      return NextResponse.json({ error: 'Inheritance config not found' }, { status: 404 });
    }

    const updatedConfig: PermissionInheritanceConfig = {
      ...existingConfig,
      ...updateData,
      organizationId, // Ensure organizationId doesn't change
      updatedAt: new Date().toISOString()
    };

    // Validate configuration
    const errors = permissionInheritanceManager.validateInheritanceConfig(updatedConfig);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Invalid configuration', details: errors }, { status: 400 });
    }

    await saveInheritanceConfig(updatedConfig);
    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating inheritance config:', error);
    return NextResponse.json({ error: 'Failed to update inheritance config' }, { status: 500 });
  }
}

// DELETE /api/users-roles/permission-inheritance - Delete inheritance config
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const filePath = path.join(INHERITANCE_DIR, `${organizationId}.json`);
    
    try {
      await fs.unlink(filePath);
      return NextResponse.json({ success: true });
    } catch (fileError) {
      return NextResponse.json({ error: 'Inheritance config not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting inheritance config:', error);
    return NextResponse.json({ error: 'Failed to delete inheritance config' }, { status: 500 });
  }
}
