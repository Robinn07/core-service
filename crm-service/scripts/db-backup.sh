#!/bin/bash

# Configuration
DB_NAME="getloopx_crm"
BACKUP_DIR="/var/backups/getloopx/db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$DATE.sql"
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME..."

# Run pg_dump (Assumes .pgpass is configured or DATABASE_URL is available)
# Using pg_dump with custom format for better compression
pg_dump -Fc $DATABASE_URL > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
    
    # Optional: Encrypt the backup here
    # gpg --encrypt --recipient user@example.com "$BACKUP_FILE"
    
    # Remove old backups
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +$RETENTION_DAYS -delete
    echo "Old backups cleaned up."
else
    echo "ERROR: Backup failed."
    exit 1
fi
