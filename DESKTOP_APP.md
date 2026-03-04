# 🖥️ Orbital Guard AI - Desktop Application

## Built with Electron

Cross-platform desktop application for Windows, Mac, and Linux.

---

## ✨ Features

### Desktop-Exclusive Features:
- ✅ **Offline Mode** - Run without internet
- ✅ **System Tray** - Minimize to system tray
- ✅ **Native Notifications** - OS-level alerts
- ✅ **Local File Saving** - Save PDFs directly
- ✅ **Auto-Updates** - Seamless updates
- ✅ **Better Performance** - No browser overhead

---

## 🚀 Quick Start

### Development Mode
```bash
cd frontend
npm run electron:dev
```

This starts both the Vite dev server and Electron app.

---

## 📦 Building Executables

### Build for Your Platform
```bash
npm run electron:build
```

### Build for Specific Platform
```bash
# Windows
npm run electron:build:win

# macOS  
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

### Output
Installers will be in `frontend/dist-electron/`:
- **Windows**: `Orbital-Guard-AI-Setup-1.0.0.exe`
- **macOS**: `Orbital-Guard-AI-1.0.0.dmg`
- **Linux**: `Orbital-Guard-AI-1.0.0.AppImage`

---

## 🎯 Features

### Application Menu
- **File** → Refresh Data, Quit
- **View** → Dashboard, Analytics, 3D Simulation, Fullscreen
- **Window** → Minimize, Close
- **Help** → Documentation, Report Issue, About

### System Tray
- Right-click icon for quick access
- Click to show/hide window
- Quick navigation to pages

### Keyboard Shortcuts
- `Ctrl/Cmd + R` - Refresh data
- `Ctrl/Cmd + Q` - Quit
- `F11` - Toggle fullscreen
- `Ctrl/Cmd + Shift + I` - Developer tools
- `Ctrl/Cmd + M` - Minimize
- `Ctrl/Cmd + W` - Close window

---

## 💻 System Requirements

### Windows
- Windows 10 or later
- 4GB RAM minimum
- 500MB disk space

### macOS
- macOS 11 (Big Sur) or later
- Intel or Apple Silicon
- 500MB disk space

### Linux
- Ubuntu 20.04+ / Fedora 35+ / Debian 11+
- X11 or Wayland
- 500MB disk space

---

## 🔧 Development

### Project Structure
```
frontend/
├── electron/
│   ├── main.js       # Main process
│   ├── preload.js    # Preload script
│   └── assets/       # Icons
├── electron-builder.yml
└── package.json
```

### Native API Access
The desktop app has access to:
- File system (save/load files)
- System notifications
- System tray
- Auto-updates
- Native menus

---

## 📱 vs Web Version

| Feature | Desktop | Web |
|---------|---------|-----|
| Offline Mode | ✅ | ❌ |
| System Tray | ✅ | ❌ |
| Auto-Updates | ✅ | ✅ |
| File Saving | Native | Download |
| Performance | Better | Good |
| Installation | Required | None |
| Updates | Auto | Instant |

---

## 🎨 Customization

### Change App Icon
1. Replace icons in `electron/assets/`:
   - `icon.png` (512x512 for Linux)
   - `icon.ico` (Windows)
   - `icon.icns` (macOS)

2. Rebuild:
```bash
npm run electron:build
```

---

## 🐛 Troubleshooting

### App Won't Start
- Make sure backend is running (`docker-compose up` or `python backend/api_server.py`)
- Check if port 3000 is available

### Build Fails
- Run `npm install` again
- Clear node_modules and reinstall
- Check electron-builder.yml configuration

### Icons Not Showing
- Ensure icons exist in `electron/assets/`
- Icons must be proper format (PNG, ICO, ICNS)

---

## 📦 Distribution

### GitHub Releases
1. Build for all platforms
2. Create GitHub release
3. Upload executables
4. Users download and install

### Auto-Updates
Configured to check GitHub releases for updates.

---

## 🏆 Status

**Ready to Build!**

Run `npm run electron:build` to create installer for your platform.

---

**Desktop app reuses 100% of the React web codebase!** 🎉
