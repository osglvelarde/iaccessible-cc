import { NextRequest, NextResponse } from 'next/server';
import { 
  Organization, 
  CreateOrganizationRequest, 
  UpdateOrganizationRequest,
  OrganizationsResponse,
  OrganizationFilters 
} from '@/lib/types/users-roles';
import { DEFAULT_ORGANIZATIONS } from '@/lib/users-roles-defaults';

// Mock data store - in production, this would be a database
// eslint-disable-next-line prefer-const
let organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Federal Agency Alpha',
    slug: 'federal-agency-alpha',
    domains: ['alpha.gov'],
    status: 'active',
    settings: {
      allowCustomGroups: true,
      maxUsers: 1000,
      maxOperatingUnits: 50,
      features: ['web_scan', 'pdf_scan', 'manual_testing', 'remediation']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'org-2',
    name: 'State Department Beta',
    slug: 'state-dept-beta',
    domains: ['beta.state.gov'],
    status: 'active',
    settings: {
      allowCustomGroups: true,
      maxUsers: 500,
      maxOperatingUnits: 20,
      features: ['web_scan', 'pdf_scan']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  }
];

// Helper function to check if user is global admin
function isGlobalAdmin(user: any): boolean {
  return user?.groups?.some((group: any) => group.roleType === 'global_admin') || false;
}

// Helper function to check if user is organization admin
function isOrganizationAdmin(user: any): boolean {
  return user?.groups?.some((group: any) => group.roleType === 'organization_admin') || false;
}

// GET /api/users-roles/organizations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') as 'active' | 'inactive' | 'trial' | null;
    const search = searchParams.get('search') || '';

    // TODO: In production, get user from session/auth
    const user = { groups: [{ roleType: 'global_admin' }] }; // Mock user

    let filteredOrganizations = organizations;

    // Apply filters
    if (status) {
      filteredOrganizations = filteredOrganizations.filter(org => org.status === status);
    }

    if (search) {
      filteredOrganizations = filteredOrganizations.filter(org => 
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase()) ||
        org.domains.some(domain => domain.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Access control
    if (!isGlobalAdmin(user)) {
      // Non-global admins can only see their own organization
      // For now, return empty - in production, get user's organization
      filteredOrganizations = [];
    }

    // Pagination
    const total = filteredOrganizations.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrganizations = filteredOrganizations.slice(startIndex, endIndex);

    const response: OrganizationsResponse = {
      organizations: paginatedOrganizations,
      total,
      page,
      pageSize,
      totalPages
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/users-roles/organizations
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrganizationRequest = await request.json();

    // TODO: In production, get user from session/auth
    const user = { groups: [{ roleType: 'global_admin' }] }; // Mock user

    // Check permissions - only global admins can create organizations
    if (!isGlobalAdmin(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create organizations' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.name || !body.slug || !body.domains || body.domains.length === 0) {
      return NextResponse.json(
        { error: 'Name, slug, and domains are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingOrg = organizations.find(org => org.slug === body.slug);
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 409 }
      );
    }

    // Create new organization
    const now = new Date().toISOString();
    const newOrganization: Organization = {
      id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      slug: body.slug,
      domains: body.domains,
      settings: {
        allowCustomGroups: true,
        maxUsers: 100,
        maxOperatingUnits: 10,
        features: ['web_scan', 'pdf_scan'],
        ...body.settings
      },
      status: 'active',
      billingEmail: body.billingEmail,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system' // TODO: Get from user session
    };

    organizations.push(newOrganization);

    return NextResponse.json(newOrganization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

// PUT /api/users-roles/organizations
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const body: UpdateOrganizationRequest = await request.json();

    // TODO: In production, get user from session/auth
    const user = { groups: [{ roleType: 'global_admin' }] }; // Mock user

    // Check permissions
    if (!isGlobalAdmin(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update organizations' },
        { status: 403 }
      );
    }

    // Find organization
    const orgIndex = organizations.findIndex(org => org.id === orgId);
    if (orgIndex === -1) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if slug is unique (if being updated)
    if (body.slug && body.slug !== organizations[orgIndex].slug) {
      const existingOrg = organizations.find(org => org.slug === body.slug && org.id !== orgId);
      if (existingOrg) {
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 409 }
        );
      }
    }

    // Update organization
    const updatedOrganization: Organization = {
      ...organizations[orgIndex],
      ...body,
      settings: {
        ...organizations[orgIndex].settings,
        ...body.settings
      },
      updatedAt: new Date().toISOString()
    };

    organizations[orgIndex] = updatedOrganization;

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

// DELETE /api/users-roles/organizations
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // TODO: In production, get user from session/auth
    const user = { groups: [{ roleType: 'global_admin' }] }; // Mock user

    // Check permissions - only global admins can delete organizations
    if (!isGlobalAdmin(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete organizations' },
        { status: 403 }
      );
    }

    // Find organization
    const orgIndex = organizations.findIndex(org => org.id === orgId);
    if (orgIndex === -1) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // TODO: Check for dependent data (users, operating units, etc.)
    // For now, just deactivate instead of delete
    organizations[orgIndex] = {
      ...organizations[orgIndex],
      status: 'inactive',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
