@echo off
echo ========================================
echo    FixGSM Platform - Starting Servers
echo ========================================
echo.

echo Starting Backend Server (FastAPI)...
start "FixGSM Backend" cmd /k "cd backend && python start_server.py"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server (React)...
start "FixGSM Frontend" cmd /k "cd frontend && start_frontend.bat"

echo.
echo ========================================
echo    Servers are starting up...
echo ========================================
echo.
echo Backend API:  http://localhost:8000
echo Backend Docs: http://localhost:8000/docs
echo Frontend:     http://localhost:3000
echo.
echo Both servers will open in separate windows.
echo Close the windows to stop the servers.
echo.
pause
