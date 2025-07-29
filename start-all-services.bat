@echo off
title AdaptiLearn Backend Services

echo.
echo =====================================
echo   🚀 AdaptiLearn Hackathon Demo      
echo =====================================
echo.

REM Set console colors
echo [92m✅ Starting backend services...[0m
echo.

REM Start each service in a new window
echo [93m🤖 Starting AI Service (Port 8000)...[0m
start "AI Service" cmd /k "cd backend\ai-service && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [93m🚪 Starting API Gateway (Port 8080)...[0m
start "API Gateway" cmd /k "cd backend\api-gateway && npm run dev"

timeout /t 2 /nobreak >nul

echo [93m📊 Starting Data Service (Port 8001)...[0m
start "Data Service" cmd /k "cd backend\data-service && npm run dev"

timeout /t 3 /nobreak >nul

echo [93m🌐 Starting Frontend (Port 3000)...[0m
start "Frontend" cmd /k "npm start"

echo.
echo [92m✅ All services are starting![0m
echo.
echo [96m🎯 Demo URLs:[0m
echo [96m   Frontend:     http://localhost:3000[0m
echo [96m   AI Service:   http://localhost:8000[0m
echo [96m   API Gateway:  http://localhost:8080[0m
echo [96m   Data Service: http://localhost:8001[0m
echo.
echo [95m⏰ Services will be ready in ~30 seconds[0m
echo [95m📋 Check the individual windows for any errors[0m
echo.
echo [91mPress any key to close this launcher...[0m
pause >nul
