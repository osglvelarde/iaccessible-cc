import { MongoClient, Db } from 'mongodb';

// Allow MONGODB_URI to be undefined during module load - it will be checked when getDatabase is called
function getMongoUri(): string {
  if (!process.env.MONGODB_URI) {
    throw new Error('MongoDB URI is not configured. Please set MONGODB_URI environment variable.');
  }
  return process.env.MONGODB_URI;
}

// Check if MongoDB is configured
export function isMongoConfigured(): boolean {
  return !!process.env.MONGODB_URI;
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }
  
  const uri = getMongoUri();
  
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
    return clientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    return clientPromise;
  }
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB_NAME || 'iaccessible-cc');
}

export default getClientPromise;

