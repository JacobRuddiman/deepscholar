#!/usr/bin/env ts-node

/**
 * Database Migration Rollback Script
 *
 * Rolls back the last applied migration
 *
 * Usage:
 *   npm run db:rollback [migration-name]
 *
 * Examples:
 *   npm run db:rollback                    # Rollback last migration
 *   npm run db:rollback 20240101_add_user  # Rollback specific migration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function rollbackMigration(migrationName?: string) {
  try {
    console.log('\n🔍 Checking migration status...\n');

    // Get migration status
    const { stdout: statusOutput } = await execAsync('npx prisma migrate status');
    console.log(statusOutput);

    if (statusOutput.includes('Database schema is up to date')) {
      console.log('\n✅ No pending migrations found.');

      if (!migrationName) {
        console.log('\n⚠️  Warning: Rolling back will mark the last migration as rolled back.');
        console.log('This does NOT automatically revert database changes.');
        console.log('You must manually write and run SQL to undo the changes.\n');

        const confirm = await question('Are you sure you want to continue? (yes/no): ');

        if (confirm.toLowerCase() !== 'yes') {
          console.log('\n❌ Rollback cancelled.');
          rl.close();
          return;
        }
      }

      // Get the last migration name from status
      const migrations = statusOutput.match(/\d{14}_[\w_]+/g) || [];
      const lastMigration = migrations[migrations.length - 1];

      const targetMigration = migrationName || lastMigration;

      if (!targetMigration) {
        console.log('\n❌ No migration found to rollback.');
        rl.close();
        return;
      }

      console.log(`\n🔄 Rolling back migration: ${targetMigration}\n`);

      // Mark migration as rolled back
      await execAsync(`npx prisma migrate resolve --rolled-back "${targetMigration}"`);

      console.log(`\n✅ Migration "${targetMigration}" marked as rolled back.`);
      console.log('\n⚠️  IMPORTANT: This only marks the migration as rolled back.');
      console.log('You must manually write SQL to undo the database changes:');
      console.log(`\n1. Review: prisma/migrations/${targetMigration}/migration.sql`);
      console.log('2. Write SQL to undo those changes');
      console.log('3. Run: npx prisma db execute --file=undo.sql --schema=prisma/schema.prisma\n');

    } else if (statusOutput.includes('following migrations have not yet been applied')) {
      console.log('\n⚠️  You have pending migrations. Apply them first with:');
      console.log('    npx prisma migrate deploy\n');
    } else {
      console.log('\n❌ Unknown migration state. Please check manually.\n');
    }

  } catch (error) {
    console.error('\n❌ Error rolling back migration:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    rl.close();
  }
}

// Get migration name from command line argument
const migrationName = process.argv[2];

rollbackMigration(migrationName);
