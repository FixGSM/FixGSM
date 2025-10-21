# MongoDB Database Tools Installer for Windows
# Automatic download and installation script

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "MongoDB Database Tools Installer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$toolsVersion = "100.9.5"
$downloadUrl = "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-windows-x86_64-$toolsVersion.zip"
$downloadPath = "$env:TEMP\mongodb-tools.zip"
$extractPath = "$env:TEMP\mongodb-tools"
$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin"

Write-Host "[1/5] Downloading MongoDB Database Tools v$toolsVersion..." -ForegroundColor Yellow

try {
    # Download with progress
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✓ Download complete!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual download link:" -ForegroundColor Yellow
    Write-Host $downloadUrl
    exit 1
}

Write-Host "[2/5] Extracting files..." -ForegroundColor Yellow

try {
    # Clean up old extraction
    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force
    }
    
    # Extract ZIP
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    Write-Host "✓ Extraction complete!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Extraction failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[3/5] Finding extracted bin folder..." -ForegroundColor Yellow

# Find the bin folder (structure: mongodb-tools/mongodb-database-tools-windows-x86_64-VERSION/bin)
$binPath = Get-ChildItem -Path $extractPath -Recurse -Directory -Filter "bin" | Select-Object -First 1

if (-not $binPath) {
    Write-Host "✗ Could not find bin folder in extracted files" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found bin folder: $($binPath.FullName)" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Installing to MongoDB folder..." -ForegroundColor Yellow
Write-Host "Target: $mongoPath" -ForegroundColor Cyan

try {
    # Check if we need admin rights
    $testFile = Join-Path $mongoPath "test_write.tmp"
    try {
        [System.IO.File]::WriteAllText($testFile, "test")
        Remove-Item $testFile -Force
        $hasWriteAccess = $true
    } catch {
        $hasWriteAccess = $false
    }
    
    if (-not $hasWriteAccess) {
        Write-Host ""
        Write-Host "⚠ Administrator rights required!" -ForegroundColor Red
        Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or copy files manually:" -ForegroundColor Yellow
        Write-Host "From: $($binPath.FullName)" -ForegroundColor Cyan
        Write-Host "To:   $mongoPath" -ForegroundColor Cyan
        exit 1
    }
    
    # Copy all executables from bin folder
    $files = Get-ChildItem -Path $binPath.FullName -Filter "*.exe"
    
    foreach ($file in $files) {
        Copy-Item -Path $file.FullName -Destination $mongoPath -Force
        Write-Host "  ✓ Copied: $($file.Name)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✓ Installation complete!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Installation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[5/5] Cleanup..." -ForegroundColor Yellow

try {
    Remove-Item $downloadPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Cleanup complete!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠ Cleanup warning (non-critical): $_" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Installation Successful!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Installed tools:" -ForegroundColor Yellow
Write-Host "  • mongodump.exe" -ForegroundColor Cyan
Write-Host "  • mongorestore.exe" -ForegroundColor Cyan
Write-Host "  • mongoexport.exe" -ForegroundColor Cyan
Write-Host "  • mongoimport.exe" -ForegroundColor Cyan
Write-Host "  • mongostat.exe" -ForegroundColor Cyan
Write-Host "  • mongotop.exe" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification:" -ForegroundColor Yellow
Write-Host "  Run: mongodump --version" -ForegroundColor Cyan
Write-Host ""

Write-Host "Note: Close and reopen PowerShell/Terminal to use the tools" -ForegroundColor Yellow
Write-Host ""

