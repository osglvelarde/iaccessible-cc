import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  PermissionInheritanceRule,
  PermissionInheritanceConfig
} from '@/lib/types/users-roles';
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

// Helper function to load inheritance config
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

// POST /api/users-roles/permission-inheritance/rules - Create inheritance rule
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const ruleData: Omit<PermissionInheritanceRule, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    if (!ruleData.organizationId || !ruleData.moduleKey) {
      return NextResponse.json({ error: 'organizationId and moduleKey are required' }, { status: 400 });
    }

    const config = await loadInheritanceConfig(ruleData.organizationId);
    if (!config) {
      return NextResponse.json({ error: 'Inheritance config not found' }, { status: 404 });
    }

    // Check if rule already exists for this module
    const existingRule = config.rules.find(rule => rule.moduleKey === ruleData.moduleKey);
    if (existingRule) {
      return NextResponse.json({ error: 'Rule already exists for this module' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newRule: PermissionInheritanceRule = {
      id: uuidv4(),
      ...ruleData,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system' // TODO: Get from auth context
    };

    config.rules.push(newRule);
    config.updatedAt = now;

    await saveInheritanceConfig(config);
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Error creating inheritance rule:', error);
    return NextResponse.json({ error: 'Failed to create inheritance rule' }, { status: 500 });
  }
}

// PUT /api/users-roles/permission-inheritance/rules - Update inheritance rule
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const organizationId = searchParams.get('organizationId');
    
    if (!ruleId || !organizationId) {
      return NextResponse.json({ error: 'ruleId and organizationId are required' }, { status: 400 });
    }

    const updateData: Partial<Omit<PermissionInheritanceRule, 'id' | 'organizationId' | 'createdAt' | 'createdBy'>> = await request.json();
    
    const config = await loadInheritanceConfig(organizationId);
    if (!config) {
      return NextResponse.json({ error: 'Inheritance config not found' }, { status: 404 });
    }

    const ruleIndex = config.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return NextResponse.json({ error: 'Inheritance rule not found' }, { status: 404 });
    }

    const updatedRule: PermissionInheritanceRule = {
      ...config.rules[ruleIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    config.rules[ruleIndex] = updatedRule;
    config.updatedAt = new Date().toISOString();

    await saveInheritanceConfig(config);
    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error('Error updating inheritance rule:', error);
    return NextResponse.json({ error: 'Failed to update inheritance rule' }, { status: 500 });
  }
}

// DELETE /api/users-roles/permission-inheritance/rules - Delete inheritance rule
export async function DELETE(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const organizationId = searchParams.get('organizationId');
    
    if (!ruleId || !organizationId) {
      return NextResponse.json({ error: 'ruleId and organizationId are required' }, { status: 400 });
    }

    const config = await loadInheritanceConfig(organizationId);
    if (!config) {
      return NextResponse.json({ error: 'Inheritance config not found' }, { status: 404 });
    }

    const ruleIndex = config.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return NextResponse.json({ error: 'Inheritance rule not found' }, { status: 404 });
    }

    config.rules.splice(ruleIndex, 1);
    config.updatedAt = new Date().toISOString();

    await saveInheritanceConfig(config);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inheritance rule:', error);
    return NextResponse.json({ error: 'Failed to delete inheritance rule' }, { status: 500 });
  }
}
