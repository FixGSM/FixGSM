@echo off
echo ===================================
echo Stopping FixGSM Development Servers
echo ===================================
echo.

REM Stop Python (Backend)
echo [1/2] Stopping Backend Server...
taskkill /F /FI "WINDOWTITLE eq Backend Server*" > nul 2>&1
taskkill /F /IM python.exe /FI "MEMUSAGE gt 10000" > nul 2>&1

REM Stop Node (Frontend)
echo [2/2] Stopping Frontend Server...
taskkill /F /FI "WINDOWTITLE eq Frontend Server*" > nul 2>&1
taskkill /F /IM node.exe /FI "MEMUSAGE gt 10000" > nul 2>&1

echo.
echo ===================================
echo All servers stopped!
echo ===================================
echo.
pause
