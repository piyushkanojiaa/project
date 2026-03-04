#!/bin/bash

echo "========================================"
echo "Orbital Guard AI - Setup Script"
echo "========================================"
echo ""

echo "Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js found: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python not found!"
    echo "Please install Python from: https://www.python.org/"
    exit 1
fi
echo "[OK] Python found: $(python3 --version)"

echo ""
echo "========================================"
echo "Installing Dependencies..."
echo "========================================"
echo ""

echo "Step 1/2: Installing Backend Dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Backend installation failed!"
    exit 1
fi
echo "[OK] Backend dependencies installed"
cd ..

echo ""
echo "Step 2/2: Installing Frontend Dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend installation failed!"
    exit 1
fi
echo "[OK] Frontend dependencies installed"
cd ..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "1. Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python start_server.py"
echo ""
echo "2. Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "========================================"
