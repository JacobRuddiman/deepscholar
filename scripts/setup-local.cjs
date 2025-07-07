const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up LOCAL mode for DeepScholar...');

try {
  // Backup current schema if it exists
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const localSchemaPath = path.join(process.cwd(), 'prisma', 'schema.local.prisma');
  const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup');

  if (fs.existsSync(schemaPath)) {
    console.log('📁 Backing up current schema...');
    fs.copyFileSync(schemaPath, backupPath);
  }

  // Copy SQLite schema for local mode
  if (fs.existsSync(localSchemaPath)) {
    console.log('📋 Switching to SQLite schema...');
    fs.copyFileSync(localSchemaPath, schemaPath);
  } else {
    console.error('❌ Local schema file not found at:', localSchemaPath);
    process.exit(1);
  }

  // Generate Prisma client for SQLite
  console.log('⚙️  Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Create and push database schema
  console.log('🗄️  Creating local database...');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });

  // Seed the database
  console.log('🌱 Seeding local database...');
  execSync('node scripts/seed-local.cjs', { stdio: 'inherit' });

  console.log('');
  console.log('✅ LOCAL mode setup complete!');
  console.log('');
  console.log('🎉 Your DeepScholar is now running in LOCAL mode:');
  console.log('- SQLite database created at ./dev.db');
  console.log('- Demo user automatically logged in');
  console.log('- Sample briefs and data available');
  console.log('- No external API keys required');
  console.log('');
  console.log('To start the application:');
  console.log('  npm run dev');
  console.log('');
  console.log('To restore production mode:');
  console.log('  npm run restore:production');

} catch (error) {
  console.error('❌ Setup failed:', error instanceof Error ? error.message : String(error));
  
  // Try to restore backup if setup failed
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup');
  
  if (fs.existsSync(backupPath)) {
    console.log('🔄 Restoring original schema...');
    fs.copyFileSync(backupPath, schemaPath);
  }
  
  process.exit(1);
}
