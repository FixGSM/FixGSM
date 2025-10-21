# Install MongoDB Tools locally in project

Write-Host "Installing MongoDB Tools to backend/mongodb-tools..." -ForegroundColor Cyan

$toolsVersion = "100.9.5"
$downloadUrl = "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-windows-x86_64-$toolsVersion.zip"
$downloadPath = "backend\mongodb-tools.zip"
$extractPath = "backend\mongodb-tools-extracted"
$targetPath = "backend\mongodb-tools"

# Download
Write-Host "[1/3] Downloading..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
Write-Host "  Done!" -ForegroundColor Green

# Extract
Write-Host "[2/3] Extracting..." -ForegroundColor Yellow
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
Write-Host "  Done!" -ForegroundColor Green

# Copy executables
Write-Host "[3/3] Installing..." -ForegroundColor Yellow
if (-not (Test-Path $targetPath)) { New-Item -ItemType Directory -Force -Path $targetPath | Out-Null }
$binPath = Get-ChildItem -Path $extractPath -Recurse -Directory -Filter "bin" | Select-Object -First 1
Copy-Item -Path "$($binPath.FullName)\*.exe" -Destination $targetPath -Force
Write-Host "  Done!" -ForegroundColor Green

# Cleanup
Remove-Item $downloadPath -Force -ErrorAction SilentlyContinue
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

# Verify
Write-Host ""
Write-Host "Installed tools:" -ForegroundColor Green
Get-ChildItem -Path $targetPath -Filter "*.exe" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }

Write-Host ""
Write-Host "MongoDB Tools installed successfully in: $targetPath" -ForegroundColor Green

