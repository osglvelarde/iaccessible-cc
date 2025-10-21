import { NextRequest, NextResponse } from 'next/server';
import { bulkOperationsManager } from '@/lib/bulk-operations';
import { getOrganizations } from '@/lib/users-roles-api';
import { getOperatingUnits } from '@/lib/users-roles-api';

// POST /api/users-roles/bulk-operations/import-users - Bulk import users from CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csvFile') as File;
    const organizationId = formData.get('organizationId') as string;
    const actorId = formData.get('actorId') as string;
    const actorEmail = formData.get('actorEmail') as string;

    if (!csvFile) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    if (!organizationId || !actorId || !actorEmail) {
      return NextResponse.json({ 
        error: 'organizationId, actorId, and actorEmail are required' 
      }, { status: 400 });
    }

    // Read CSV file
    const csvData = await csvFile.text();
    
    // Parse CSV data
    const { users, errors: parseErrors } = bulkOperationsManager.parseUserImportCSV(csvData);
    
    if (parseErrors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing errors', 
        details: parseErrors 
      }, { status: 400 });
    }

    // Validate organization hierarchy
    const [organizations, operatingUnits] = await Promise.all([
      getOrganizations(),
      getOperatingUnits()
    ]);

    const hierarchyValidation = bulkOperationsManager.validateOrganizationHierarchy(
      users,
      organizations.organizations,
      operatingUnits.operatingUnits
    );

    if (!hierarchyValidation.valid) {
      return NextResponse.json({ 
        error: 'Organization hierarchy validation failed', 
        details: hierarchyValidation.errors 
      }, { status: 400 });
    }

    // Perform bulk user creation
    const results = await bulkOperationsManager.bulkCreateUsers(users, actorId, actorEmail);

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      createdUsers: results.success,
      failedUsers: results.errors.length,
      errors: results.errors
    });
  } catch (error) {
    console.error('Error in bulk user import:', error);
    return NextResponse.json({ error: 'Failed to import users' }, { status: 500 });
  }
}
