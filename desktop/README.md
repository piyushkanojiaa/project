# Orbital Guard AI - Desktop Application

![Orbital Guard AI](assets/icon.png)

Desktop application for space debris monitoring and collision avoidance, built with Electron.

## Features

- **Native Desktop Experience** - Full-featured desktop app for Windows, macOS, and Linux
- **System Tray Integration** - Quick access from your system tray
- **Auto-Updates** - Automatic updates when new versions are available  
- **Offline Capable** - Works with cached data when offline
- **Native Menus** - Platform-native menus and keyboard shortcuts
- **File Export** - Save reports and data locally

## Installation

### From Release (Recommended)

1. Download the latest release for your platform:
   - **Windows**: `Orbital-Guard-AI-1.0.0-x64.exe`
   - **macOS**: `Orbital-Guard-AI-1.0.0.dmg`
   - **Linux**: `Orbital-Guard-AI-1.0.0.AppImage`

2. Install and run

### From Source

```bash
# Install dependencies
npm install

# Run in development mode (requires web app running on localhost:3000)
npm run dev

# Build for production
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Frontend app running on `localhost:3000` (for development)

### Running Development Mode

1. Start the web app:
```bash
cd ../frontend
npm run dev
```

2. In a new terminal, start Electron:
```bash
cd desktop
npm run dev
```

### Building

```bash
# Build web app first
npm run build:web

# Then build desktop app
npm run build
```

Output will be in `desktop/build/`

## Keyboard Shortcuts

- **Ctrl/Cmd + R** - Refresh
- **Ctrl/Cmd + Q** - Quit
- **F11** - Toggle Fullscreen
- **Ctrl/Cmd + Shift + I** - Toggle Developer Tools

## System Tray

The app runs in the system tray for quick access:
- **Click tray icon** - Show/hide window
- **Right-click** - Show menu with quick navigation

## Auto-Updates

The app automatically checks for updates on startup (production builds only). You'll be notified when updates are available.

## Project Structure

```
desktop/
├── electron/
│   ├── main.js       # Main process (window management, native features)
│   └── preload.js    # Preload script (context bridge)
├── assets/
│   ├── icon.png      # App icon (1024x1024)
│   ├── icon.ico      # Windows icon
│   └── icon.icns     # macOS icon
├── build/            # Build output (generated)
├── package.json      # Dependencies and build config
└── README.md         # This file
```

## Platform-Specific Notes

### Windows
- Installer with desktop shortcut option
- Auto-update via NSIS
- Portable build available

### macOS
- DMG installer
- Code signing required for distribution
- Apple Developer account needed for App Store

### Linux
- AppImage (universal)
- .deb package (Debian/Ubuntu)
- .rpm package (Fedora/RHEL)

## API Configuration

The desktop app connects to the backend API at:
- **Development**: `http://localhost:8000`
- **Production**: Can be configured via environment variables

## Troubleshooting

### App won't start
- Ensure backend server is running (`http://localhost:8000`)
- Check console for errors: `Ctrl/Cmd + Shift + I`

### Updates not working
- Auto-updates only work with signed production builds
- For development, manual updates required

### White screen on launch
- Wait a few seconds for the app to load
- If persists, check if frontend build exists in `../frontend/dist`

## Building Icons

Icon requirements:
- **Windows**: .ico file (256x256)
- **macOS**: .icns file (1024x1024)
- **Linux**: .png file (512x512 or 1024x1024)

Use `electron-icon-builder` to generate from a single PNG:
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./icon-source.png --output=./assets
```

## License

MIT

## Support

For issues or questions:
- GitHub Issues: [github.com/your-username/orbital-guard-ai/issues](https://github.com/your-username/orbital-guard-ai/issues)
- Documentation: [docs link]

---

**Built with**:
- [Electron](https://www.electronjs.org/) - Desktop framework
- [electron-builder](https://www.electron.build/) - Packaging
- [electron-updater](https://www.electron.build/auto-update) - Auto-updates
