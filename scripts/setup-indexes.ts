// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import path from 'path';

// Load .env.local before importing anything that needs it
config({ path: path.join(process.cwd(), '.env.local') });

// Now import other modules
import { createIndexes } from '../src/lib/mongodb-indexes';

async function main() {
  console.log('Setting up MongoDB indexes...');
  try {
    await createIndexes();
    console.log('Indexes setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Index setup failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);



