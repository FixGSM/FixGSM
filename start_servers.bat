@echo off
echo ===================================
echo Starting FixGSM Development Servers
echo ===================================
echo.

REM Start backend server in a new window
echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && python start_server.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server in a new window
echo [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && yarn start"

echo.
echo ===================================
echo Both servers are starting!
echo ===================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ===================================
echo.
echo Press any key to exit this window...
pause > nul
