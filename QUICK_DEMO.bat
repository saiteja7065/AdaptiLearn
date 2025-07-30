@echo off
cls
echo ========================================
echo    🚀 AdaptiLearn - Quick Demo Start
echo ========================================
echo.
echo Starting AdaptiLearn for review...
echo.
echo Frontend will open at: http://localhost:3000
echo Backend services starting on ports 8000, 8001, 8080
echo.
echo ⏱️  Please wait 30 seconds for all services to start
echo.

REM Start backend services in background
start /min "AI Service" cmd /c "cd backend\ai-service && python -m uvicorn app:app --reload --port 8000"
timeout /t 2 /nobreak > nul

start /min "API Gateway" cmd /c "cd backend\api-gateway && npm run dev"
timeout /t 2 /nobreak > nul

start /min "Data Service" cmd /c "cd backend\data-service && npm run dev"
timeout /t 3 /nobreak > nul

echo ✅ Backend services started
echo 🚀 Starting frontend...
echo.

REM Start frontend (this will open browser)
npm start