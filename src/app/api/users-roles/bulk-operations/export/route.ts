import { NextRequest, NextResponse } from 'next/server';
import { 
  exportUsersToCSV, 
  exportGroupsToCSV, 
  exportOperatingUnitsToCSV, 
  exportOrganizationsToCSV 
} from '@/lib/bulk-operations';
import { getUsers } from '@/lib/users-roles-api';
import { getGroups } from '@/lib/users-roles-api';
import { getOperatingUnits } from '@/lib/users-roles-api';
import { getOrganizations } from '@/lib/users-roles-api';

// GET /api/users-roles/bulk-operations/export - Export data to CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type'); // 'users', 'groups', 'operating-units', 'organizations'
    const organizationId = searchParams.get('organizationId');
    const format = searchParams.get('format') || 'csv';

    if (!exportType) {
      return NextResponse.json({ error: 'Export type is required' }, { status: 400 });
    }

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only CSV format is supported' }, { status: 400 });
    }

    let csvData = '';
    let filename = '';

    switch (exportType) {
      case 'users': {
        if (!organizationId) {
          return NextResponse.json({ error: 'organizationId is required for user export' }, { status: 400 });
        }

        const [usersResponse, organizationsResponse, operatingUnitsResponse, groupsResponse] = await Promise.all([
          getUsers({ organizationId }),
          getOrganizations(),
          getOperatingUnits(),
          getGroups()
        ]);

        csvData = exportUsersToCSV(
          usersResponse.users,
          organizationsResponse.organizations,
          operatingUnitsResponse.operatingUnits,
          groupsResponse.groups
        );
        filename = `users-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'groups': {
        if (!organizationId) {
          return NextResponse.json({ error: 'organizationId is required for group export' }, { status: 400 });
        }

        const [groupsResponse, organizationsResponse, operatingUnitsResponse] = await Promise.all([
          getGroups({ organizationId }),
          getOrganizations(),
          getOperatingUnits()
        ]);

        csvData = exportGroupsToCSV(
          groupsResponse.groups,
          organizationsResponse.organizations,
          operatingUnitsResponse.operatingUnits
        );
        filename = `groups-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'operating-units': {
        const [operatingUnitsResponse, organizationsResponse] = await Promise.all([
          getOperatingUnits(),
          getOrganizations()
        ]);

        csvData = exportOperatingUnitsToCSV(
          operatingUnitsResponse.operatingUnits,
          organizationsResponse.organizations
        );
        filename = `operating-units-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'organizations': {
        const organizationsResponse = await getOrganizations();
        csvData = exportOrganizationsToCSV(organizationsResponse.organizations);
        filename = `organizations-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
