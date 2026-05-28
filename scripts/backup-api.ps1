# HamLog API Backup Script
# Downloads a backup of your QSO log via the HamLog API.
#
# Usage:
#   .\scripts\backup-api.ps1 -Username myuser -Password mypass
#   .\scripts\backup-api.ps1 -Format adif -Username myuser -Password mypass
#   .\scripts\backup-api.ps1 -Format json -BaseUrl http://192.168.1.50:8050
#
# Environment variables (override parameters):
#   HAMLOG_USERNAME, HAMLOG_PASSWORD, HAMLOG_URL
#
# Output goes to ./backups/ by default.

param(
    [ValidateSet("json", "adif")]
    [string]$Format = "json",
    [string]$Username = "",
    [string]$Password = "",
    [string]$BaseUrl = "",
    [string]$OutDir = ""
)

# Load .env from backend directory for defaults
$envFile = Join-Path $PSScriptRoot ".." "backend" ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
        }
    }
}

# Resolve parameters from env vars
if (-not $Username) { $Username = $env:HAMLOG_USERNAME }
if (-not $Password) { $Password = $env:HAMLOG_PASSWORD }
if (-not $BaseUrl) { $BaseUrl = if ($env:HAMLOG_URL) { $env:HAMLOG_URL } else { "http://localhost:8050" } }
if (-not $OutDir) { $OutDir = Join-Path $PSScriptRoot ".." "backups" }

if (-not $Username -or -not $Password) {
    Write-Host "ERROR: Username and password are required." -ForegroundColor Red
    Write-Host "Provide via -Username/-Password parameters or HAMLOG_USERNAME/HAMLOG_PASSWORD env vars."
    exit 1
}

# Ensure output directory exists
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$ext = if ($Format -eq "json") { "json" } else { "adi" }
$outPath = Join-Path $OutDir "hamlog-backup-${timestamp}.${ext}"

# Step 1: Login
Write-Host "Logging in as $Username ..."
$loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
try {
    $loginRes = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" `
        -ContentType "application/json" -Body $loginBody
} catch {
    Write-Host "ERROR: Login failed. Check username/password and server URL." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

$token = $loginRes.token
if (-not $token) {
    Write-Host "ERROR: No token returned from login." -ForegroundColor Red
    exit 1
}

# Step 2: Download backup
Write-Host "Downloading $Format backup ..."
try {
    Invoke-WebRequest -Uri "$BaseUrl/api/backup/$Format" `
        -Headers @{ Authorization = "Bearer $token" } `
        -OutFile $outPath
} catch {
    Write-Host "ERROR: Download failed." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

$size = (Get-Item $outPath).Length
Write-Host "Backup saved: $outPath ($size bytes)"
