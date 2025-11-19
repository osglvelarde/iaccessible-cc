// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import path from 'path';

// Load .env.local before importing anything that needs it
const envPath = path.join(process.cwd(), '.env.local');
console.log('Loading environment from:', envPath);
const result = config({ path: envPath });
if (result.error) {
  console.error('Error loading .env.local:', result.error);
} else {
  console.log('Environment loaded successfully');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
}

// Now import other modules
import { promises as fs } from 'fs';
import { getDatabase } from '../src/lib/mongodb';
import { User, UserGroup, OperatingUnit, Organization } from '../src/lib/types/users-roles';
import { DEFAULT_ORGANIZATIONS } from '../src/lib/users-roles-defaults';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'users-roles-data');

async function migrateOrganizations() {
  const db = await getDatabase();
  const collection = db.collection<Organization>('organizations');
  
  try {
    // Check if organizations already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Organizations collection already has ${existingCount} documents. Skipping migration.`);
      return;
    }

    // Migrate from DEFAULT_ORGANIZATIONS
    const now = new Date().toISOString();
    const organizations: Organization[] = DEFAULT_ORGANIZATIONS.map(org => ({
      ...org,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      createdBy: 'system'
    }));

    if (organizations.length > 0) {
      await collection.insertMany(organizations);
      console.log(`Migrated ${organizations.length} organizations`);
    } else {
      console.log('No organizations to migrate');
    }
  } catch (error) {
    console.error('Error migrating organizations:', error);
    throw error;
  }
}

async function migrateOperatingUnits() {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>('operatingUnits');
  const ouDir = path.join(DATA_DIR, 'operating-units');
  
  try {
    // Check if operating units already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Operating units collection already has ${existingCount} documents. Skipping migration.`);
      return;
    }

    const files = await fs.readdir(ouDir);
    const ouFiles = files.filter(f => f.endsWith('.json'));
    
    const operatingUnits: OperatingUnit[] = [];
    for (const file of ouFiles) {
      try {
        const filePath = path.join(ouDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const ou: OperatingUnit = JSON.parse(content);
        operatingUnits.push(ou);
      } catch (error) {
        console.error(`Error reading operating unit file ${file}:`, error);
      }
    }

    if (operatingUnits.length > 0) {
      await collection.insertMany(operatingUnits);
      console.log(`Migrated ${operatingUnits.length} operating units`);
    } else {
      console.log('No operating units to migrate');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Operating units directory does not exist. Skipping.');
      return;
    }
    console.error('Error migrating operating units:', error);
    throw error;
  }
}

async function migrateGroups() {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>('groups');
  const groupsDir = path.join(DATA_DIR, 'groups');
  
  try {
    // Check if groups already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Groups collection already has ${existingCount} documents. Skipping migration.`);
      return;
    }

    const files = await fs.readdir(groupsDir);
    const groupFiles = files.filter(f => f.endsWith('.json'));
    
    const groups: UserGroup[] = [];
    for (const file of groupFiles) {
      try {
        const filePath = path.join(groupsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const group: UserGroup = JSON.parse(content);
        groups.push(group);
      } catch (error) {
        console.error(`Error reading group file ${file}:`, error);
      }
    }

    if (groups.length > 0) {
      await collection.insertMany(groups);
      console.log(`Migrated ${groups.length} groups`);
    } else {
      console.log('No groups to migrate');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Groups directory does not exist. Skipping.');
      return;
    }
    console.error('Error migrating groups:', error);
    throw error;
  }
}

async function migrateUsers() {
  const db = await getDatabase();
  const collection = db.collection<User>('users');
  const usersDir = path.join(DATA_DIR, 'users');
  
  try {
    // Check if users already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Users collection already has ${existingCount} documents. Skipping migration.`);
      return;
    }

    const files = await fs.readdir(usersDir);
    const userFiles = files.filter(f => f.endsWith('.json'));
    
    const users: User[] = [];
    for (const file of userFiles) {
      try {
        const filePath = path.join(usersDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const user: User = JSON.parse(content);
        users.push(user);
      } catch (error) {
        console.error(`Error reading user file ${file}:`, error);
      }
    }

    if (users.length > 0) {
      await collection.insertMany(users);
      console.log(`Migrated ${users.length} users`);
    } else {
      console.log('No users to migrate');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Users directory does not exist. Skipping.');
      return;
    }
    console.error('Error migrating users:', error);
    throw error;
  }
}

async function main() {
  console.log('Starting migration to MongoDB...');
  try {
    await migrateOrganizations();
    await migrateOperatingUnits();
    await migrateGroups();
    await migrateUsers();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

