import { getDatabase } from './mongodb';

export async function createIndexes() {
  const db = await getDatabase();
  
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ operatingUnitId: 1 });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ groupIds: 1 });
    
    // Groups collection indexes
    await db.collection('groups').createIndex({ id: 1 }, { unique: true });
    await db.collection('groups').createIndex({ organizationId: 1 });
    await db.collection('groups').createIndex({ operatingUnitId: 1 });
    
    // Operating Units collection indexes
    await db.collection('operatingUnits').createIndex({ id: 1 }, { unique: true });
    await db.collection('operatingUnits').createIndex({ organizationId: 1 });
    
    // Organizations collection indexes
    await db.collection('organizations').createIndex({ id: 1 }, { unique: true });
    await db.collection('organizations').createIndex({ slug: 1 }, { unique: true });
    
    // User Profiles collection indexes
    await db.collection('userProfiles').createIndex({ userId: 1 }, { unique: true });
    await db.collection('userProfiles').createIndex({ id: 1 }, { unique: true });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't throw - indexes might already exist
  }
}

