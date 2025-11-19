import { getDatabase } from '../mongodb';
import { UserProfile } from '../types/user-profile';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'userProfiles';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = await getDatabase();
  const collection = db.collection<UserProfile>(COLLECTION_NAME);
  return collection.findOne({ userId });
}

export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const existing = await getUserProfile(userId);
  if (existing) {
    return existing;
  }
  
  // Create default profile
  const now = new Date().toISOString();
  const defaultProfile: UserProfile = {
    id: uuidv4(),
    userId,
    preferences: {
      theme: 'system',
      notifications: {
        email: true,
        sessionWarnings: true,
        moduleUpdates: false
      },
      autoSaveRecentModules: true
    },
    favorites: [],
    recentModules: [],
    moduleUsage: [],
    customSettings: {},
    createdAt: now,
    updatedAt: now
  };
  
  return await createUserProfile(defaultProfile);
}

export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  const db = await getDatabase();
  const collection = db.collection<UserProfile>(COLLECTION_NAME);
  await collection.insertOne(profile);
  return profile;
}

export async function updateUserProfile(
  userId: string, 
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const db = await getDatabase();
  const collection = db.collection<UserProfile>(COLLECTION_NAME);
  const result = await collection.findOneAndUpdate(
    { userId },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date().toISOString() 
      } 
    },
    { 
      returnDocument: 'after',
      upsert: true // Create if doesn't exist
    }
  );
  return result || null;
}

export async function deleteUserProfile(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<UserProfile>(COLLECTION_NAME);
  const result = await collection.deleteOne({ userId });
  return result.deletedCount > 0;
}

// Favorites operations
export async function addFavorite(userId: string, moduleKey: string, title: string): Promise<UserProfile | null> {
  const profile = await getOrCreateUserProfile(userId);
  const favorite = {
    moduleKey,
    title,
    addedAt: new Date().toISOString()
  };
  
  // Check if already exists
  if (profile.favorites.some(f => f.moduleKey === moduleKey)) {
    return profile;
  }
  
  return await updateUserProfile(userId, {
    favorites: [...profile.favorites, favorite]
  });
}

export async function removeFavorite(userId: string, moduleKey: string): Promise<UserProfile | null> {
  const profile = await getOrCreateUserProfile(userId);
  return await updateUserProfile(userId, {
    favorites: profile.favorites.filter(f => f.moduleKey !== moduleKey)
  });
}

// Recent modules operations
export async function addRecentModule(userId: string, title: string, href: string): Promise<UserProfile | null> {
  const profile = await getOrCreateUserProfile(userId);
  const recentModule = {
    title,
    href,
    timestamp: Date.now()
  };
  
  // Remove existing entry if it exists, then add to front
  const filtered = profile.recentModules.filter(m => m.href !== href);
  const updated = [recentModule, ...filtered].slice(0, 6); // Keep only 6 most recent
  
  return await updateUserProfile(userId, {
    recentModules: updated
  });
}

// Module usage operations
export async function trackModuleUsage(userId: string, moduleKey: string): Promise<UserProfile | null> {
  const profile = await getOrCreateUserProfile(userId);
  const now = new Date().toISOString();
  
  const existingUsage = profile.moduleUsage.find(u => u.moduleKey === moduleKey);
  const updatedUsage = existingUsage
    ? {
        ...existingUsage,
        lastUsed: now,
        usageCount: existingUsage.usageCount + 1
      }
    : {
        moduleKey,
        lastUsed: now,
        usageCount: 1
      };
  
  const moduleUsage = existingUsage
    ? profile.moduleUsage.map(u => u.moduleKey === moduleKey ? updatedUsage : u)
    : [...profile.moduleUsage, updatedUsage];
  
  return await updateUserProfile(userId, {
    moduleUsage
  });
}



