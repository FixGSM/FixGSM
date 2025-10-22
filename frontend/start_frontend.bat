@echo off
echo ===================================
echo Starting FixGSM Frontend (Dev Mode)
echo ===================================
echo.
echo Installing dependencies if needed...
call yarn install
echo.
echo Starting React development server...
echo Frontend will be available at: http://localhost:3000
echo.
call yarn start
