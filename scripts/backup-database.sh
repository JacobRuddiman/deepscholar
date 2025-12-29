#!/bin/bash

###############################################################################
# Database Backup Script
#
# Creates a backup of the PostgreSQL database
#
# Usage:
#   ./scripts/backup-database.sh [backup-name]
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#
# Examples:
#   ./scripts/backup-database.sh                    # Auto-generated filename
#   ./scripts/backup-database.sh pre-deployment     # Custom filename
###############################################################################

set -e  # Exit on error

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backups directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate backup filename
if [ -z "$1" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_NAME="backup_${TIMESTAMP}"
else
  BACKUP_NAME="$1_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo "🔄 Starting database backup..."
echo "📦 Database: $DB_NAME"
echo "🗄️  Backup file: $BACKUP_FILE_GZ"
echo ""

# Set password environment variable for pg_dump
export PGPASSWORD=$DB_PASS

# Create backup with pg_dump
echo "⏳ Dumping database..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --verbose \
  > $BACKUP_FILE 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "✅ Database dump completed successfully"

  # Compress backup
  echo "🗜️  Compressing backup..."
  gzip $BACKUP_FILE

  # Get file size
  FILE_SIZE=$(du -h $BACKUP_FILE_GZ | cut -f1)

  echo ""
  echo "✅ Backup completed successfully!"
  echo "📁 Location: $BACKUP_FILE_GZ"
  echo "📊 Size: $FILE_SIZE"
  echo ""

  # List recent backups
  echo "📋 Recent backups:"
  ls -lh $BACKUP_DIR/*.gz | tail -n 5

else
  echo "❌ Backup failed!"
  rm -f $BACKUP_FILE
  exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "💡 To restore this backup, run:"
echo "   ./scripts/restore-database.sh $BACKUP_FILE_GZ"
