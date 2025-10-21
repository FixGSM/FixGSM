# Simple MongoDB Database Tools Installer

Write-Host "MongoDB Database Tools Installer" -ForegroundColor Cyan
Write-Host ""

$toolsVersion = "100.9.5"
$downloadUrl = "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-windows-x86_64-$toolsVersion.zip"
$downloadPath = "$env:TEMP\mongodb-tools.zip"
$extractPath = "$env:TEMP\mongodb-tools"
$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin"

Write-Host "[1/4] Downloading..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
Write-Host "Done!" -ForegroundColor Green

Write-Host "[2/4] Extracting..." -ForegroundColor Yellow
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
Write-Host "Done!" -ForegroundColor Green

Write-Host "[3/4] Installing..." -ForegroundColor Yellow
$binPath = Get-ChildItem -Path $extractPath -Recurse -Directory -Filter "bin" | Select-Object -First 1
$files = Get-ChildItem -Path $binPath.FullName -Filter "*.exe"
foreach ($file in $files) {
    Copy-Item -Path $file.FullName -Destination $mongoPath -Force
    Write-Host "  Copied: $($file.Name)" -ForegroundColor Green
}
Write-Host "Done!" -ForegroundColor Green

Write-Host "[4/4] Cleanup..." -ForegroundColor Yellow
Remove-Item $downloadPath -Force -ErrorAction SilentlyContinue
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Green

Write-Host ""
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "Run: mongodump --version" -ForegroundColor Cyan

