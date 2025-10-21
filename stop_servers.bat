@echo off
echo ========================================
echo    FixGSM Platform - Stopping Servers
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Stopping Python processes...
taskkill /f /im python.exe >nul 2>&1

echo Stopping Uvicorn processes...
taskkill /f /im uvicorn.exe >nul 2>&1

echo.
echo ========================================
echo    All servers have been stopped
echo ========================================
echo.
pause
