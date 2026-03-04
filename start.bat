@echo off
REM Orbital Guard AI - Windows Quick Start Script
REM Starts both backend and frontend in separate windows

echo ============================================================
echo    ORBITAL GUARD AI - Quick Start
echo ============================================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo Error: backend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo Starting Backend Server...
start "Orbital Guard - Backend" cmd /k "cd backend && python start_server.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server...
start "Orbital Guard - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo    ORBITAL GUARD AI Started!
echo ============================================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo GraphQL:  http://localhost:8000/graphql
echo.
echo Press any key to close this window...
pause >nul
