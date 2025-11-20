import { getDatabase } from '../mongodb';
import { UserGroup } from '../types/users-roles';

const COLLECTION_NAME = 'groups';

export async function createGroup(group: UserGroup): Promise<UserGroup> {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>(COLLECTION_NAME);
  await collection.insertOne(group);
  return group;
}

export async function getGroupById(id: string): Promise<UserGroup | null> {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>(COLLECTION_NAME);
  return collection.findOne({ id });
}

export async function getAllGroups(): Promise<UserGroup[]> {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updateGroup(id: string, updates: Partial<UserGroup>): Promise<UserGroup | null> {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>(COLLECTION_NAME);
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result || null;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>(COLLECTION_NAME);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function findGroups(query: any): Promise<UserGroup[]> {
  const db = await getDatabase();
  const collection = db.collection<UserGroup>(COLLECTION_NAME);
  return collection.find(query).toArray();
}




