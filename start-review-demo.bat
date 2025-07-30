@echo off
echo ========================================
echo   AdaptiLearn - Review Demo Startup
echo ========================================
echo.

echo [1/4] Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependencies installation failed
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Backend Dependencies...
cd backend\ai-service
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Some AI service dependencies may have failed
)

cd ..\api-gateway
call npm install
if %errorlevel% neq 0 (
    echo WARNING: API Gateway dependencies may have failed
)

cd ..\data-service
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Data service dependencies may have failed
)

cd ..\..

echo.
echo [3/4] Starting Backend Services...
start "AI Service" cmd /k "cd backend\ai-service && python -m uvicorn app:app --reload --port 8000"
timeout /t 3 /nobreak > nul

start "API Gateway" cmd /k "cd backend\api-gateway && npm run dev"
timeout /t 2 /nobreak > nul

start "Data Service" cmd /k "cd backend\data-service && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo [4/4] Starting Frontend Application...
echo.
echo ========================================
echo   🚀 AdaptiLearn Demo Starting...
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo AI Service: http://localhost:8000
echo API Gateway: http://localhost:8080
echo Data Service: http://localhost:8001
echo.
echo Press Ctrl+C to stop all services
echo ========================================

npm start