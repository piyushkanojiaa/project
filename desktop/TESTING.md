# Electron Desktop App - Testing Guide

## Quick Test Checklist

### Prerequisites
- ✅ Frontend dev server running on `localhost:3000`
- ✅ Backend API running on `localhost:8000`

### Test Commands

```bash
# 1. Start frontend (Terminal 1)
cd frontend
npm run dev

# 2. Start backend (Terminal 2)  
cd backend
python api_server.py

# 3. Start Electron app (Terminal 3)
cd desktop
npm run dev
```

### What to Test

#### Window Management
- [ ] App window opens (1400x900)
- [ ] Window can be resized (min 1024x768)
- [ ] Window can be maximized
- [ ] Window can be minimized
- [ ] Closing window hides to tray (doesn't quit)

#### Navigation
- [ ] Dashboard page loads
- [ ] Simulation page loads
- [ ] Analytics page loads
- [ ] All interactive features work

#### Menu Bar
- [ ] File menu appears
  - [ ] Refresh works (Ctrl/Cmd+R)
  - [ ] Exit works (Ctrl/Cmd+Q)
- [ ] View menu appears
  - [ ] Navigation items work
  - [ ] Toggle fullscreen (F11)
  - [ ] DevTools open (Ctrl/Cmd+Shift+I)
- [ ] Help menu appears
  - [ ] About dialog shows
  - [ ] Check for updates works

#### System Tray
- [ ] Tray icon appears
- [ ] Tooltip shows "Orbital Guard AI - Space Debris Monitor"
- [ ] Click tray icon toggles window visibility
- [ ] Right-click shows context menu
- [ ] Menu items navigate correctly

#### Features
- [ ] External links open in default browser
- [ ] File save dialog works (try exporting data)
- [ ] App info displays correctly

### Expected Behavior

**On Launch**:
- Window fades in smoothly
- In dev mode: DevTools open automatically
- Console shows: "🚀 Orbital Guard AI Desktop App Started"

**On Close**:
- Window hides to tray
- App continues running in background
- Tray icon remains visible

**On Quit** (Ctrl/Cmd+Q):
- App fully terminates
- Tray icon disappears

### Common Issues

**White Screen**:
- Check if frontend is running on `localhost:3000`
- Open DevTools and check console

**Tray Icon Missing**:
- Check `assets/icon.png` exists
- Platform may need specific icon format

**Menu Not Appearing (macOS)**:
- This is expected - macOS uses native menu bar
- Check top of screen for menu

## Building for Production

### Build Frontend First
```bash
cd frontend
npm run build
```

This creates `frontend/dist/` with production build.

### Build Desktop App
```bash
cd desktop

# All platforms
npm run build

# Or specific platform
npm run build:win    # Windows
npm run build:mac    # macOS  
npm run build:linux  # Linux
```

### Build Output

Build artifacts in `desktop/build/`:
- **Windows**: `.exe` installer, portable `.exe`
- **macOS**: `.dmg` installer, `.zip`
- **Linux**: `.AppImage`, `.deb`, `.rpm`

### Testing Production Build

**Windows**:
```bash
./build/Orbital-Guard-AI-1.0.0-win-x64.exe
```

**macOS**:
```bash
open build/Orbital-Guard-AI-1.0.0.dmg
```

**Linux**:
```bash
chmod +x build/Orbital-Guard-AI-1.0.0.AppImage
./build/Orbital-Guard-AI-1.0.0.AppImage
```

## Manual Testing Script

Run through this complete test:

1. **Launch** - `npm run dev`
2. **Navigate** - Click Dashboard → Simulation → Analytics
3. **Menu** - Use View menu to navigate
4. **Tray** - Check tray icon, right-click menu
5. **Close** - Click X, verify window hides
6. **Restore** - Click tray icon to show window
7. **Fullscreen** - Press F11, verify fullscreen toggle
8. **DevTools** - Press Ctrl+Shift+I
9. **External Link** - Try opening external link (should open browser)
10. **Quit** - Press Ctrl+Q, verify app fully quits

✅ All tests passed = Ready for production build!
