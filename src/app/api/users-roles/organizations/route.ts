import { NextRequest, NextResponse } from 'next/server';
import { 
  Organization, 
  CreateOrganizationRequest, 
  UpdateOrganizationRequest,
  OrganizationsResponse
} from '@/lib/types/users-roles';
import { v4 as uuidv4 } from 'uuid';
import * as OrganizationModel from '@/lib/models/Organization';
import { validateOrganizationCreation, sanitizeString, sanitizeEmail } from '@/lib/validation/users-roles';
import { mongoDBAuditLogger, getRequestMetadata } from '@/lib/mongodb-audit-logger';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminAuth, isGlobalAdmin } from '@/lib/auth-helpers';

// GET /api/users-roles/organizations
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
    const status = searchParams.get('status') as 'active' | 'inactive' | 'trial' | null;
    const search = searchParams.get('search') || '';

    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { domains: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Access control - only global admins can see all organizations
    if (!isGlobalAdmin(adminUser)) {
      // Organization admins can only see their own organization
      if (adminUser.organization) {
        query.id = adminUser.organization.id;
      } else {
        return NextResponse.json({
          organizations: [],
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
      const collection = db.collection<Organization>('organizations');
      
      // Get total count
      const total = await collection.countDocuments(query);
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;

      // Fetch paginated organizations
      const paginatedOrganizations = await collection
        .find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const response: OrganizationsResponse = {
        organizations: paginatedOrganizations,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(response);
    } catch (dbError: any) {
      // Fallback to model-based approach if direct MongoDB access fails
      console.warn('Direct MongoDB access failed, using model fallback:', dbError?.message);
      
      const allOrganizations = await OrganizationModel.findOrganizations(query);
      
      // Pagination
      const total = allOrganizations.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrganizations = allOrganizations.slice(startIndex, endIndex);

      const response: OrganizationsResponse = {
        organizations: paginatedOrganizations,
        total,
        page,
        pageSize,
        totalPages
      };

      return NextResponse.json(response);
    }
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch organizations',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/users-roles/organizations
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    const body: CreateOrganizationRequest = await request.json();
    const metadata = getRequestMetadata(request);

    // Check permissions - only global admins can create organizations
    if (!isGlobalAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create organizations. Only global administrators can create organizations.' },
        { status: 403 }
      );
    }

    // Remove status from create request (only for updates)
    const { status, ...createData } = body as any;
    
    // Auto-convert slug to lowercase and replace spaces with hyphens
    if (createData.slug) {
      createData.slug = createData.slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    // Validate input
    const validation = validateOrganizationCreation(createData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors,
          message: validation.errors.join('; ')
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(createData.name);
    const sanitizedSlug = createData.slug.toLowerCase().trim();

    // Check if slug is unique
    const existingOrg = await OrganizationModel.getOrganizationBySlug(sanitizedSlug);
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 409 }
      );
    }

    // Sanitize domains - extract domain from URLs if needed
    const { extractDomain } = await import('@/lib/validation/users-roles');
    const sanitizedDomains = body.domains.map(d => extractDomain(d.trim()));

    // Create new organization
    const now = new Date().toISOString();
    const orgId = uuidv4();
    const newOrganization: Organization = {
      id: orgId,
      name: sanitizedName,
      slug: sanitizedSlug,
      domains: sanitizedDomains,
      settings: {
        allowCustomGroups: true,
        maxUsers: 100,
        maxOperatingUnits: 10,
        features: ['web_scan', 'pdf_scan'],
        ...body.settings
      },
      status: 'active',
      billingEmail: body.billingEmail ? sanitizeEmail(body.billingEmail) : undefined,
      createdAt: now,
      updatedAt: now,
      createdBy: adminUser.id // Use authenticated admin user's ID
    };

    await OrganizationModel.createOrganization(newOrganization);

    // Log audit entry (don't fail if audit logging fails)
    try {
      await mongoDBAuditLogger.logOrganizationAction(
        'organization_created',
        orgId,
        adminUser.id, // Use authenticated admin user's ID
        adminUser.email, // Use authenticated admin user's email
        { organizationData: { from: null, to: { name: sanitizedName, slug: sanitizedSlug } } },
        metadata.ipAddress,
        metadata.userAgent
      );
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError);
      // Continue - audit logging failure shouldn't break the operation
    }

    return NextResponse.json(newOrganization, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create organization',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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

    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    // Check permissions - only global admins can update organizations
    if (!isGlobalAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update organizations. Only global administrators can update organizations.' },
        { status: 403 }
      );
    }

    // Find organization
    const existingOrg = await OrganizationModel.getOrganizationById(orgId);
    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if slug is unique (if being updated)
    if (body.slug && body.slug !== existingOrg.slug) {
      const slugOrg = await OrganizationModel.getOrganizationBySlug(body.slug);
      if (slugOrg) {
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 409 }
        );
      }
    }

    // Update organization
    const updateData: Partial<Organization> = {
      ...body,
      settings: {
        ...existingOrg.settings,
        ...body.settings
      }
    };

    const updatedOrganization = await OrganizationModel.updateOrganization(orgId, updateData);
    
    if (!updatedOrganization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

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

    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult.response) {
      return authResult.response;
    }
    const adminUser = authResult.user;

    // Check permissions - only global admins can delete organizations
    if (!isGlobalAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete organizations. Only global administrators can delete organizations.' },
        { status: 403 }
      );
    }

    // Find organization
    const existingOrg = await OrganizationModel.getOrganizationById(orgId);
    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // TODO: Check for dependent data (users, operating units, etc.)
    // For now, just deactivate instead of delete
    const updatedOrg = await OrganizationModel.updateOrganization(orgId, { status: 'inactive' });
    
    if (!updatedOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
