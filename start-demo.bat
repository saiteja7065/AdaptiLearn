@echo off
echo 🚀 Starting AdaptiLearn Hackathon Demo...
echo ⚡ Setting up backend services...

REM Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Please install Python 3.8+ to run AI service
    echo 📋 For now, we'll run frontend + API gateway + data service
    echo.
    echo 🌐 Starting frontend and Node.js services...
    npm run concurrently "cd backend/api-gateway && npm run dev" "cd backend/data-service && npm run dev" "npm run dev:frontend"
) else (
    echo ✅ Python found. Starting all services...
    echo.
    npm run dev:all
)

echo.
echo 🎯 Demo URLs:
echo 🌐 Frontend: http://localhost:3000
echo 🤖 AI Service: http://localhost:8000  
echo 🚪 API Gateway: http://localhost:8080
echo 📊 Data Service: http://localhost:8001
echo.
echo ⏰ Ready for demo in ~30 seconds...
pause
