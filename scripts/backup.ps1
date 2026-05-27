# HamLog Database Backup Script
# Run this BEFORE any schema migration or risky operation.
#
# Usage:
#   .\scripts\backup.ps1
#   .\scripts\backup.ps1 -Label "pre-migration-001"
#
# Restoring from backup:
#   docker exec -i hamlog-db-1 mysql -u hamlog -p HamLogDB < backups\HamLogDB-<timestamp>.sql
#   (or: mysql -u $DB_USER -p HamLogDB < backups\HamLogDB-<timestamp>.sql if running MySQL locally)

param(
    [string]$Label = ""
)

# Load .env from backend directory
$envFile = Join-Path $PSScriptRoot ".." "backend" ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
        }
    }
}

$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "hamlog" }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "hamlog_pw" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "HamLogDB" }

$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$backupDir = Join-Path $PSScriptRoot ".." "backups"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$filename = if ($Label) { "${dbName}-${timestamp}-${Label}.sql" } else { "${dbName}-${timestamp}.sql" }
$backupPath = Join-Path $backupDir $filename

Write-Host "Backing up ${dbName} to $backupPath ..."
$env:MYSQL_PWD = $dbPassword
mysqldump --single-transaction --routines --triggers -h $dbHost -u $dbUser $dbName | Out-File -FilePath $backupPath -Encoding utf8
$env:MYSQL_PWD = $null

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $backupPath).Length
    Write-Host "Backup complete: $backupPath ($size bytes)"
} else {
    Write-Host "ERROR: mysqldump failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
