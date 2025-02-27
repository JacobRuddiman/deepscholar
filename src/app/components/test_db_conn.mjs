// test-db-conn.mjs
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file from project root
dotenv.config({ path: join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL); // Log the URL (obscure password if logging)
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection successful!', result);
    return true;
  } catch (error) {
    console.error('Connection failed. Error details:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();