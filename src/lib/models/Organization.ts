import { getDatabase } from '../mongodb';
import { Organization } from '../types/users-roles';

const COLLECTION_NAME = 'organizations';

export async function createOrganization(organization: Organization): Promise<Organization> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  await collection.insertOne(organization);
  return organization;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  return collection.findOne({ id });
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  return collection.findOne({ slug });
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result || null;
}

export async function deleteOrganization(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function findOrganizations(query: any): Promise<Organization[]> {
  const db = await getDatabase();
  const collection = db.collection<Organization>(COLLECTION_NAME);
  return collection.find(query).toArray();
}



