#!/bin/bash

# Start SLA Development Environment
# This script starts both the API server and web frontend

echo "🚀 Starting SLA Development Environment..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $API_PID $WEB_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start API server
echo "📡 Starting API server on port 8000..."
cd /Users/bokarhamma/SLA-DEV
source venv/bin/activate
python simple_admin_api.py &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start web frontend
echo "🌐 Starting web frontend on port 5173..."
cd /Users/bokarhamma/SLA-DEV/apps/web
npm run dev &
WEB_PID=$!

echo "✅ Development environment started!"
echo "   📡 API Server: http://localhost:8000"
echo "   🌐 Web Frontend: http://localhost:5173"
echo "   🔐 Admin Dashboard: http://localhost:5173/admin"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $API_PID $WEB_PID
