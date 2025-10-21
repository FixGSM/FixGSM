@echo off
echo Setting environment variables for frontend...
set REACT_APP_BACKEND_URL=http://localhost:8000
set REACT_APP_ENABLE_VISUAL_EDITS=false
set FAST_REFRESH=false

echo Starting React development server...
npm start
