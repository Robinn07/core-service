# Configuration
$DB_NAME = "getloopx_crm"
$BACKUP_DIR = "C:\backups\getloopx\db"
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\$DB_NAME-$DATE.sql"
$RETENTION_DAYS = 7

# Ensure backup directory exists
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR
}

Write-Host "Starting database backup for $DB_NAME..."

# Run pg_dump (Assumes pg_dump is in System PATH)
# Use $env:DATABASE_URL if available, or specify parameters
& pg_dump -Fc $env:DATABASE_URL > "$BACKUP_FILE"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful: $BACKUP_FILE"
    
    # Remove old backups
    Get-ChildItem $BACKUP_DIR -Filter "*.sql" | Where-Object { 
        $_.LastWriteTime -lt (Get-Date).AddDays(-$RETENTION_DAYS) 
    } | Remove-Item
    Write-Host "Old backups cleaned up."
} else {
    Write-Error "ERROR: Backup failed."
    exit 1
}
