# 📦 ORBITAL GUARD AI - TRANSFER & SETUP GUIDE

**Version**: 1.0.0  
**Last Updated**: February 2, 2026  
**Purpose**: Complete guide for transferring and setting up on any PC/Laptop

---

## 🎯 QUICK TRANSFER CHECKLIST

### ✅ What You Need to Transfer

**Single Folder**:
```
space-debris-ai/
```

**Location on Current PC**:
```
C:\Users\Varun\.gemini\antigravity\scratch\space-debris-ai
```

**Transfer Methods**:
- ✅ USB Drive (Recommended - ~500 MB)
- ✅ Cloud Storage (Google Drive, OneDrive, Dropbox)
- ✅ GitHub Repository
- ✅ Network Share
- ✅ External Hard Drive

---

## 📋 PRE-TRANSFER CHECKLIST

### Before Copying

1. **Stop Running Services**
   ```bash
   # Stop frontend (Ctrl+C in terminal)
   # Stop backend (Ctrl+C in terminal)
   ```

2. **Clean Build Artifacts** (Optional - Saves Space)
   ```bash
   # Frontend
   cd frontend
   rm -rf node_modules dist
   
   # Backend
   cd backend
   rm -rf __pycache__ *.pyc
   ```

3. **Verify Files**
   - ✅ All source code present
   - ✅ Configuration files included
   - ✅ Documentation files included
   - ✅ No sensitive data in files

---

## 💾 TRANSFER METHODS

### Method 1: USB Drive (Recommended)

**Steps**:
1. Insert USB drive
2. Copy entire folder:
   ```
   C:\Users\Varun\.gemini\antigravity\scratch\space-debris-ai
   ```
3. Paste to USB drive
4. Safely eject USB
5. On new PC: Copy from USB to desired location

**Estimated Time**: 5-10 minutes  
**Size**: ~500 MB (with node_modules) or ~50 MB (without)

---

### Method 2: GitHub (Best Practice)

**Steps**:

1. **Initialize Git** (if not already done)
   ```bash
   cd C:\Users\Varun\.gemini\antigravity\scratch\space-debris-ai
   git init
   ```

2. **Create .gitignore** (already included)
   ```
   node_modules/
   __pycache__/
   *.pyc
   .env
   dist/
   build/
   ```

3. **Commit Files**
   ```bash
   git add .
   git commit -m "Initial commit - Orbital Guard AI"
   ```

4. **Push to GitHub**
   ```bash
   # Create repo on GitHub first
   git remote add origin https://github.com/yourusername/orbital-guard-ai.git
   git branch -M main
   git push -u origin main
   ```

5. **On New PC: Clone**
   ```bash
   git clone https://github.com/yourusername/orbital-guard-ai.git
   cd orbital-guard-ai
   ```

**Advantages**:
- ✅ Version control
- ✅ Easy updates
- ✅ Backup
- ✅ Collaboration ready

---

### Method 3: Cloud Storage

**Google Drive / OneDrive / Dropbox**:

1. Upload folder to cloud storage
2. Share link or sync to new PC
3. Download to desired location

**Estimated Time**: 10-30 minutes (depending on internet)

---

### Method 4: Network Share

**For Same Network**:

1. Share folder on current PC
2. Access from new PC via network
3. Copy to local drive

---

## 🖥️ SETUP ON NEW PC

### Prerequisites Installation

#### Windows

**1. Install Node.js**
```
Download: https://nodejs.org/
Version: 18.x or higher
Installer: Windows Installer (.msi)
```

**2. Install Python**
```
Download: https://www.python.org/downloads/
Version: 3.11 or higher
✅ Check "Add Python to PATH"
```

**3. Install Git** (Optional - for GitHub method)
```
Download: https://git-scm.com/download/win
```

#### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Python
brew install python@3.11

# Install Git
brew install git
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3.11 python3-pip

# Install Git
sudo apt install -y git
```

---

## 🚀 SETUP STEPS

### Step 1: Extract/Copy Project

**Windows**:
```
Copy to: C:\Projects\orbital-guard-ai
or any location you prefer
```

**macOS/Linux**:
```
Copy to: ~/Projects/orbital-guard-ai
or any location you prefer
```

---

### Step 2: Backend Setup

**Open Terminal/Command Prompt**:

```bash
# Navigate to project
cd C:\Projects\orbital-guard-ai  # Windows
cd ~/Projects/orbital-guard-ai   # macOS/Linux

# Go to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Or use virtual environment (recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

**Estimated Time**: 5-10 minutes

---

### Step 3: Frontend Setup

**Open New Terminal**:

```bash
# Navigate to frontend
cd C:\Projects\orbital-guard-ai\frontend  # Windows
cd ~/Projects/orbital-guard-ai/frontend   # macOS/Linux

# Install dependencies
npm install

# Or use yarn
yarn install
```

**Estimated Time**: 2-5 minutes

---

### Step 4: Start Application

**Terminal 1 - Backend**:
```bash
cd backend
python start_server.py
```
**Access**: http://localhost:8000

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
**Access**: http://localhost:3000

---

## 🔧 AUTOMATED SETUP SCRIPTS

### Windows Setup Script

**Create**: `setup-windows.bat`

```batch
@echo off
echo ========================================
echo Orbital Guard AI - Windows Setup
echo ========================================

echo.
echo Step 1: Installing Backend Dependencies...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

echo.
echo Step 2: Installing Frontend Dependencies...
cd ..\frontend
call npm install

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Backend: cd backend ^& python start_server.py
echo 2. Frontend: cd frontend ^& npm run dev
echo.
pause
```

**Usage**:
```bash
# Right-click setup-windows.bat
# Select "Run as Administrator"
```

---

### macOS/Linux Setup Script

**Create**: `setup-unix.sh`

```bash
#!/bin/bash

echo "========================================"
echo "Orbital Guard AI - Setup Script"
echo "========================================"

echo ""
echo "Step 1: Installing Backend Dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "Step 2: Installing Frontend Dependencies..."
cd ../frontend
npm install

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && python start_server.py"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
```

**Usage**:
```bash
chmod +x setup-unix.sh
./setup-unix.sh
```

---

## 📁 PROJECT STRUCTURE (Portable)

```
orbital-guard-ai/
│
├── 📄 README.md                    # Main documentation
├── 📄 EVALUATOR_REPORT.md          # Complete project report
├── 📄 TRANSFER_GUIDE.md            # This file
├── 📄 QUICK_START.md               # Quick start guide
├── 📄 setup-windows.bat            # Windows setup script
├── 📄 setup-unix.sh                # macOS/Linux setup script
│
├── 📂 backend/                     # Python Backend
│   ├── requirements.txt           # Python dependencies
│   ├── start_server.py            # Server launcher
│   ├── api_server.py              # Main API
│   └── ...                        # Other backend files
│
├── 📂 frontend/                    # React Frontend
│   ├── package.json               # Node dependencies
│   ├── vite.config.ts             # Vite config
│   ├── vercel.json                # Vercel config
│   └── src/                       # Source code
│
├── 📂 desktop/                     # Desktop App
│   └── ...                        # Electron files
│
├── 📄 docker-compose.yml           # Docker setup
├── 📄 .gitignore                  # Git ignore rules
└── 📄 .env.example                # Environment template
```

---

## 🔍 VERIFICATION CHECKLIST

### After Transfer

- [ ] All files copied successfully
- [ ] No missing folders
- [ ] Configuration files present
- [ ] Documentation readable

### After Setup

- [ ] Node.js installed (check: `node --version`)
- [ ] Python installed (check: `python --version`)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:8000

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue 1: "node: command not found"

**Solution**:
```bash
# Verify Node.js installation
node --version

# If not found, reinstall Node.js
# Download from: https://nodejs.org/
```

---

### Issue 2: "python: command not found"

**Solution**:
```bash
# Try python3
python3 --version

# Or reinstall Python
# Download from: https://www.python.org/
```

---

### Issue 3: "npm install" fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Issue 4: Port already in use

**Solution**:
```bash
# Frontend (port 3000)
# Change in vite.config.ts:
server: {
  port: 3001  // Use different port
}

# Backend (port 8000)
# Change in start_server.py:
uvicorn.run(app, host="0.0.0.0", port=8001)
```

---

### Issue 5: Missing dependencies

**Solution**:
```bash
# Backend
pip install -r requirements.txt --upgrade

# Frontend
npm install --legacy-peer-deps
```

---

## 🌐 ENVIRONMENT CONFIGURATION

### Create .env File

**Backend** (`backend/.env`):
```env
# Database (optional for basic features)
DATABASE_URL=sqlite:///./orbital_guard.db

# Space-Track.org (optional - for live TLE data)
SPACETRACK_USERNAME=your_username
SPACETRACK_PASSWORD=your_password

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

**Frontend** (`frontend/.env`):
```env
# API URL
VITE_API_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=Orbital Guard AI
VITE_APP_VERSION=1.0.0
```

---

## 📊 SYSTEM REQUIREMENTS

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10+, macOS 10.15+, Ubuntu 20.04+ |
| **CPU** | Dual-core 2.0 GHz |
| **RAM** | 4 GB |
| **Storage** | 2 GB free space |
| **Node.js** | 18.x or higher |
| **Python** | 3.11 or higher |
| **Browser** | Chrome 90+, Edge 90+, Safari 14+ |

### Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| **CPU** | Quad-core 3.0 GHz |
| **RAM** | 8 GB |
| **Storage** | 5 GB free space |
| **GPU** | Dedicated GPU (for better 3D performance) |

---

## 🎯 QUICK START (After Transfer)

### 1-Minute Setup

```bash
# 1. Navigate to project
cd orbital-guard-ai

# 2. Run setup script
# Windows: setup-windows.bat
# macOS/Linux: ./setup-unix.sh

# 3. Start backend (Terminal 1)
cd backend
python start_server.py

# 4. Start frontend (Terminal 2)
cd frontend
npm run dev

# 5. Open browser
# http://localhost:3000
```

---

## 📦 PACKAGE FOR DISTRIBUTION

### Create ZIP Archive

**Windows**:
```bash
# Right-click folder
# Send to > Compressed (zipped) folder
```

**macOS/Linux**:
```bash
zip -r orbital-guard-ai.zip orbital-guard-ai/
```

### Create TAR Archive

```bash
tar -czf orbital-guard-ai.tar.gz orbital-guard-ai/
```

---

## 🔐 SECURITY NOTES

### Before Sharing

1. **Remove Sensitive Data**
   - Delete `.env` files
   - Remove API keys
   - Clear credentials

2. **Use .env.example**
   ```env
   # Example environment file
   DATABASE_URL=your_database_url_here
   SPACETRACK_USERNAME=your_username_here
   SPACETRACK_PASSWORD=your_password_here
   ```

3. **Check .gitignore**
   ```
   .env
   *.pyc
   __pycache__/
   node_modules/
   dist/
   ```

---

## ✅ TRANSFER COMPLETE CHECKLIST

### Before Transfer
- [ ] Stop all running services
- [ ] Clean build artifacts (optional)
- [ ] Verify all files present
- [ ] Remove sensitive data
- [ ] Create .env.example

### During Transfer
- [ ] Choose transfer method
- [ ] Copy entire folder
- [ ] Verify file integrity
- [ ] No corruption during transfer

### After Transfer (New PC)
- [ ] Install prerequisites (Node.js, Python)
- [ ] Extract/copy project
- [ ] Run setup script
- [ ] Install dependencies
- [ ] Configure environment
- [ ] Start services
- [ ] Verify functionality

---

## 🎓 TRAINING NEW USERS

### Documentation to Share

1. **README.md** - Project overview
2. **QUICK_START.md** - Getting started
3. **EVALUATOR_REPORT.md** - Complete details
4. **TRANSFER_GUIDE.md** - This file

### Video Tutorial (Optional)

Record screen showing:
1. Project transfer
2. Setup process
3. Starting services
4. Basic usage

---

## 📞 SUPPORT

### If Issues Occur

1. **Check Documentation**
   - README.md
   - QUICK_START.md
   - This guide

2. **Verify Prerequisites**
   - Node.js version
   - Python version
   - Dependencies installed

3. **Common Solutions**
   - Restart terminals
   - Clear caches
   - Reinstall dependencies

---

## 🎉 SUCCESS INDICATORS

### You're Ready When:

- ✅ Backend starts without errors
- ✅ Frontend loads in browser
- ✅ 3D visualization renders
- ✅ API responds to requests
- ✅ No console errors
- ✅ All routes accessible

---

## 📊 TRANSFER SIZE ESTIMATES

| Configuration | Size |
|---------------|------|
| **Full** (with node_modules) | ~500 MB |
| **Minimal** (without node_modules) | ~50 MB |
| **Compressed ZIP** | ~100 MB |
| **Git Repository** | ~30 MB |

**Recommendation**: Transfer without `node_modules` and `dist` folders, then run `npm install` on new PC.

---

## ✅ FINAL CHECKLIST

- [ ] Project copied to new location
- [ ] Prerequisites installed
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Services running
- [ ] Application accessible
- [ ] All features working

---

**Transfer Time Estimate**: 15-30 minutes (including setup)

**Status**: READY FOR TRANSFER 🚀

---

*End of Transfer Guide*
