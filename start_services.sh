#!/bin/bash

# Start SLA AI Chatbot Services
# This script starts both the backend API server and frontend web application

echo "🚀 Starting SLA AI Chatbot Services..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Check if ports are available
if ! check_port 8000; then
    echo "❌ Backend port 8000 is already in use. Please stop the existing service first."
    exit 1
fi

if ! check_port 5173; then
    echo "❌ Frontend port 5173 is already in use. Please stop the existing service first."
    exit 1
fi

# Start backend server
echo "🔧 Starting backend API server..."
source venv/bin/activate
python api_server.py &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "🎨 Starting frontend web application..."
source /Users/bokarhamma/.zshrc
pnpm dev:web &
FRONTEND_PID=$!
echo "✅ Frontend started with PID: $FRONTEND_PID"

# Wait a moment for frontend to start
sleep 3

# Check if services are running
echo "🔍 Checking service status..."
if lsof -i :8000 >/dev/null 2>&1; then
    echo "✅ Backend API server is running on http://localhost:8000"
    echo "   📚 API Documentation: http://localhost:8000/docs"
else
    echo "❌ Backend API server failed to start"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo "✅ Frontend web application is running on http://localhost:5173"
else
    echo "❌ Frontend web application failed to start"
fi

echo ""
echo "🎉 Services started successfully!"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🔧 Backend:  http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""
echo "To stop services, run: pkill -f 'api_server.py' && pkill -f 'vite'"
echo "Or use Ctrl+C to stop this script"

# Keep script running and show logs
echo "📋 Service logs (Ctrl+C to stop):"
wait
