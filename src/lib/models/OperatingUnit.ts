import { getDatabase } from '../mongodb';
import { OperatingUnit } from '../types/users-roles';

const COLLECTION_NAME = 'operatingUnits';

export async function createOperatingUnit(operatingUnit: OperatingUnit): Promise<OperatingUnit> {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>(COLLECTION_NAME);
  await collection.insertOne(operatingUnit);
  return operatingUnit;
}

export async function getOperatingUnitById(id: string): Promise<OperatingUnit | null> {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>(COLLECTION_NAME);
  return collection.findOne({ id });
}

export async function getAllOperatingUnits(): Promise<OperatingUnit[]> {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updateOperatingUnit(id: string, updates: Partial<OperatingUnit>): Promise<OperatingUnit | null> {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>(COLLECTION_NAME);
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result || null;
}

export async function deleteOperatingUnit(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>(COLLECTION_NAME);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function findOperatingUnits(query: any): Promise<OperatingUnit[]> {
  const db = await getDatabase();
  const collection = db.collection<OperatingUnit>(COLLECTION_NAME);
  return collection.find(query).toArray();
}



