// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import path from 'path';

// Load .env.local before importing anything that needs it
config({ path: path.join(process.cwd(), '.env.local') });

// Now import other modules
import { getDatabase } from '../src/lib/mongodb';
import { User, UserGroup, OperatingUnit, Organization } from '../src/lib/types/users-roles';
import { MOCK_USERS, PREDEFINED_ROLES, DEFAULT_ORGANIZATIONS } from '../src/lib/users-roles-defaults';
import { v4 as uuidv4 } from 'uuid';
import * as UserModel from '../src/lib/models/User';
import * as GroupModel from '../src/lib/models/Group';
import * as OperatingUnitModel from '../src/lib/models/OperatingUnit';
import * as OrganizationModel from '../src/lib/models/Organization';

async function getOrCreateOrganizations() {
  const organizations = await OrganizationModel.getAllOrganizations();
  if (organizations.length === 0) {
    console.log('No organizations found, creating default organizations...');
    const now = new Date().toISOString();
    for (const orgData of DEFAULT_ORGANIZATIONS) {
      const org: Organization = {
        ...orgData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system'
      };
      await OrganizationModel.createOrganization(org);
      organizations.push(org);
    }
  }
  return organizations;
}

async function getOrCreateOperatingUnits(organizations: Organization[]) {
  const operatingUnits = await OperatingUnitModel.getAllOperatingUnits();
  const org1 = organizations.find(o => o.slug === 'federal-agency-alpha') || organizations[0];
  const org2 = organizations.find(o => o.slug === 'state-dept-beta') || organizations[1] || organizations[0];
  
  // Create default operating units if they don't exist
  const ou1 = operatingUnits.find(ou => ou.name === 'Digital Services' || ou.organizationId === org1.id);
  const ou2 = operatingUnits.find(ou => ou.name === 'Public Affairs' || (ou.organizationId === org1.id && ou.id !== ou1?.id));
  
  const createdOUs: OperatingUnit[] = [];
  
  if (!ou1) {
    const newOU1: OperatingUnit = {
      id: 'ou-1',
      organizationId: org1.id,
      name: 'Digital Services',
      organization: 'Department of Technology',
      domains: ['tech.gov', 'digital.gov'],
      description: 'Primary digital services operating unit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await OperatingUnitModel.createOperatingUnit(newOU1);
    createdOUs.push(newOU1);
    operatingUnits.push(newOU1);
  } else {
    createdOUs.push(ou1);
  }
  
  if (!ou2) {
    const newOU2: OperatingUnit = {
      id: 'ou-2',
      organizationId: org1.id,
      name: 'Public Affairs',
      organization: 'Department of Communications',
      domains: ['public.gov', 'news.gov'],
      description: 'Public affairs and communications unit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await OperatingUnitModel.createOperatingUnit(newOU2);
    createdOUs.push(newOU2);
    operatingUnits.push(newOU2);
  } else {
    if (ou2) createdOUs.push(ou2);
  }
  
  return { operatingUnits, ou1: createdOUs[0], ou2: createdOUs[1] || createdOUs[0] };
}

async function getOrCreateGroups(organizations: Organization[], operatingUnits: OperatingUnit[]) {
  const org1 = organizations.find(o => o.slug === 'federal-agency-alpha') || organizations[0];
  const ou1 = operatingUnits.find(ou => ou.id === 'ou-1' || ou.name === 'Digital Services') || operatingUnits[0];
  
  const existingGroups = await GroupModel.getAllGroups();
  const groupMap = new Map<string, UserGroup>();
  
  // Map of role types to group IDs
  const roleToGroupId: Record<string, string> = {
    'global_admin': 'group-global-admin',
    'organization_admin': 'group-organization-admin',
    'operating_unit_admin': 'group-operating-unit-admin',
    'remediator_tester': 'group-remediator-tester',
    'viewer': 'group-viewer'
  };
  
  // Create predefined groups if they don't exist
  for (const [roleType, groupId] of Object.entries(roleToGroupId)) {
    let group = existingGroups.find(g => g.id === groupId);
    
    if (!group) {
      const roleTemplate = PREDEFINED_ROLES[roleType as keyof typeof PREDEFINED_ROLES];
      if (!roleTemplate) continue;
      
      const isOrgLevel = roleType === 'global_admin' || roleType === 'organization_admin';
      
      const newGroup: UserGroup = {
        id: groupId,
        name: roleTemplate.name,
        type: 'predefined',
        roleType: roleType as any,
        organizationId: org1.id,
        operatingUnitId: isOrgLevel ? null : ou1.id,
        scope: isOrgLevel ? 'organization' : 'operating_unit',
        permissions: roleTemplate.permissions,
        description: roleTemplate.description,
        isSystemGroup: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      };
      
      await GroupModel.createGroup(newGroup);
      group = newGroup;
      console.log(`Created group: ${newGroup.name} (${groupId})`);
    }
    
    groupMap.set(groupId, group);
  }
  
  return groupMap;
}

async function createSampleUsers(organizations: Organization[], operatingUnits: OperatingUnit[], groupMap: Map<string, UserGroup>) {
  const ou1 = operatingUnits.find(ou => ou.id === 'ou-1' || ou.name === 'Digital Services') || operatingUnits[0];
  const ou2 = operatingUnits.find(ou => ou.id === 'ou-2' || ou.name === 'Public Affairs') || operatingUnits[0];
  
  // Map mock user operating unit IDs to actual IDs
  const ouMapping: Record<string, string> = {
    'ou-1': ou1.id,
    'ou-2': ou2.id
  };
  
  // Map mock user group IDs to actual group IDs
  const groupIdMapping: Record<string, string> = {
    'group-global-admin': 'group-global-admin',
    'group-organization-admin': 'group-organization-admin',
    'group-operating-unit-admin': 'group-operating-unit-admin',
    'group-remediator-tester': 'group-remediator-tester',
    'group-viewer': 'group-viewer'
  };
  
  const existingUsers = await UserModel.getAllUsers();
  const existingEmails = new Set(existingUsers.map(u => u.email));
  
  const now = new Date().toISOString();
  let createdCount = 0;
  
  for (const mockUser of MOCK_USERS) {
    if (existingEmails.has(mockUser.email)) {
      console.log(`User ${mockUser.email} already exists, skipping...`);
      continue;
    }
    
    // Map operating unit ID
    const operatingUnitId = ouMapping[mockUser.operatingUnitId] || ou1.id;
    
    // Map group IDs
    const groupIds = mockUser.groupIds
      .map(gid => groupIdMapping[gid] || gid)
      .filter(gid => groupMap.has(gid));
    
    const user: User = {
      id: uuidv4(),
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      operatingUnitId,
      groupIds,
      status: mockUser.status,
      lastLogin: mockUser.lastLogin,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      invitedBy: mockUser.invitedBy,
      invitationToken: mockUser.invitationToken,
      invitationExpiresAt: mockUser.invitationExpiresAt
    };
    
    await UserModel.createUser(user);
    createdCount++;
    console.log(`Created user: ${user.email} (${user.firstName} ${user.lastName})`);
  }
  
  return createdCount;
}

async function main() {
  console.log('Creating sample users in MongoDB...');
  try {
    // Step 1: Get or create organizations
    const organizations = await getOrCreateOrganizations();
    console.log(`Found/created ${organizations.length} organizations`);
    
    // Step 2: Get or create operating units
    const { operatingUnits, ou1, ou2 } = await getOrCreateOperatingUnits(organizations);
    console.log(`Found/created ${operatingUnits.length} operating units`);
    
    // Step 3: Get or create groups
    const groupMap = await getOrCreateGroups(organizations, operatingUnits);
    console.log(`Found/created ${groupMap.size} groups`);
    
    // Step 4: Create sample users
    const createdCount = await createSampleUsers(organizations, operatingUnits, groupMap);
    console.log(`\n✅ Created ${createdCount} sample users!`);
    console.log('\nSample users created:');
    console.log('  - admin@example.gov (Global Administrator)');
    console.log('  - orgadmin@example.gov (Organization Administrator)');
    console.log('  - manager@example.gov (Operating Unit Administrator)');
    console.log('  - tester@example.gov (Remediator/Tester)');
    console.log('  - viewer@example.gov (Viewer)');
    console.log('  - pending@example.gov (Pending - Viewer)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample users:', error);
    process.exit(1);
  }
}

main().catch(console.error);




