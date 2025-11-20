import { getDatabase } from '../mongodb';
import { User } from '../types/users-roles';

const COLLECTION_NAME = 'users';

export async function createUser(user: User): Promise<User> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  await collection.insertOne(user);
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  return collection.findOne({ id });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  return collection.findOne({ email });
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result || null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function findUsers(query: any): Promise<User[]> {
  const db = await getDatabase();
  const collection = db.collection<User>(COLLECTION_NAME);
  return collection.find(query).toArray();
}




