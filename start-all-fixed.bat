@echo off
echo Starting AdaptiLearn Services...
echo.

echo Starting AI Service (Port 8000)...
start "AI Service" cmd /k "cd backend\ai-service && python app.py"

echo Starting Data Service (Port 8001)...
start "Data Service" cmd /k "cd backend\data-service && node simple-server.js"

echo Starting React Frontend (Port 3000)...
start "React Frontend" cmd /k "npm start"

echo.
echo All services are starting...
echo - AI Service: http://localhost:8000
echo - Data Service: http://localhost:8001
echo - React Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
