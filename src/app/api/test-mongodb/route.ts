import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { createIndexes } from '@/lib/mongodb-indexes';

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    
    // Try to create indexes (idempotent operation)
    try {
      await createIndexes();
    } catch (indexError) {
      console.warn('Index creation warning (may already exist):', indexError);
    }
    
    // Get collection counts
    const collectionCounts: Record<string, number> = {};
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      collectionCounts[collection.name] = count;
    }
    
    return NextResponse.json({ 
      success: true, 
      database: db.databaseName,
      collections: collections.map(c => c.name),
      counts: collectionCounts,
      message: 'MongoDB connection successful!'
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.MONGODB_URI ? 'Connection string is set' : 'Connection string is missing'
    }, { status: 500 });
  }
}




