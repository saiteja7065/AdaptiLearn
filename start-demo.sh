#!/bin/bash

echo "🚀 Starting AdaptiLearn Hackathon Demo..."
echo "⚡ Setting up backend services..."

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+ to run AI service"
    echo "📋 For now, we'll run frontend + API gateway + data service"
    
    # Run frontend and Node.js services only
    echo "🌐 Starting frontend and Node.js services..."
    concurrently \
        "cd backend/api-gateway && npm run dev" \
        "cd backend/data-service && npm run dev" \
        "npm run dev:frontend"
else
    echo "✅ Python found. Starting all services..."
    
    # Run all services
    concurrently \
        --names "AI,GATEWAY,DATA,FRONTEND" \
        --prefix "{name}" \
        --prefix-colors "blue,green,yellow,cyan" \
        "cd backend/ai-service && python -m uvicorn main:app --reload --port 8000" \
        "cd backend/api-gateway && npm run dev" \
        "cd backend/data-service && npm run dev" \
        "npm run dev:frontend"
fi

echo ""
echo "🎯 Demo URLs:"
echo "🌐 Frontend: http://localhost:3000"
echo "🤖 AI Service: http://localhost:8000"
echo "🚪 API Gateway: http://localhost:8080"
echo "📊 Data Service: http://localhost:8001"
echo ""
echo "⏰ Ready for demo in ~30 seconds..."
