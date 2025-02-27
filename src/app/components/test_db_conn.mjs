// test-db-conn.mjs
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file from project root
dotenv.config({ path: join(__dirname, '../../../.env') });

// Create a new client instance for testing - don't use singleton for test scripts
const prisma = new PrismaClient({
  // Add connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Log queries during testing
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    
    // Use a simple query that doesn't rely on prepared statements
    // Explicitly naming the response column helps avoid issues
    const result = await prisma.$executeRaw`SELECT 1 as connected`;
    
    console.log('Connection successful!', result === 1 ? 'Database is responsive' : 'Unexpected response');
    return true;
  } catch (error) {
    console.error('Connection failed. Error details:');
    console.error(error);
    return false;
  } finally {
    // Always properly disconnect
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));