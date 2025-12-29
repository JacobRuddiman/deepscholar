#!/bin/bash

###############################################################################
# Database Restore Script
#
# Restores a PostgreSQL database from a backup file
#
# Usage:
#   ./scripts/restore-database.sh <backup-file>
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#
# Examples:
#   ./scripts/restore-database.sh backups/backup_20240115_143022.sql.gz
###############################################################################

set -e  # Exit on error

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "❌ ERROR: Please provide a backup file"
  echo ""
  echo "Usage: ./scripts/restore-database.sh <backup-file>"
  echo ""
  echo "Available backups:"
  ls -lh backups/*.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Extract database connection details
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "📦 Database: $DB_NAME"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# Set password environment variable
export PGPASSWORD=$DB_PASS

# Decompress if needed
TEMP_FILE=""
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "🗜️  Decompressing backup..."
  TEMP_FILE="${BACKUP_FILE%.gz}"
  gunzip -c $BACKUP_FILE > $TEMP_FILE
  SQL_FILE=$TEMP_FILE
else
  SQL_FILE=$BACKUP_FILE
fi

# Create a backup of current database before restoring
echo "🔄 Creating safety backup of current database..."
SAFETY_BACKUP="backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --no-owner \
  --no-acl \
  > $SAFETY_BACKUP 2>/dev/null

echo "✅ Safety backup created: $SAFETY_BACKUP"

# Restore database
echo "⏳ Restoring database..."
echo ""

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  -f $SQL_FILE \
  --single-transaction \
  2>&1

# Check if restore was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database restored successfully!"
  echo ""
  echo "💡 Next steps:"
  echo "   1. Run migrations if needed: npx prisma migrate deploy"
  echo "   2. Verify data integrity"
  echo "   3. Test application functionality"
else
  echo ""
  echo "❌ Restore failed!"
  echo "💡 You can restore from the safety backup:"
  echo "   ./scripts/restore-database.sh $SAFETY_BACKUP"
  exit 1
fi

# Clean up temp file
if [ -n "$TEMP_FILE" ]; then
  rm -f $TEMP_FILE
fi

# Unset password
unset PGPASSWORD
