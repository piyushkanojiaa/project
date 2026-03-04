/**
 * Electron Preload Script
 * 
 * Exposes safe APIs to the renderer process via context bridge
 */

const { contextBridge, ipcRenderer } = require('electron');

// ============================================================
// Exposed API
// ============================================================

contextBridge.exposeInMainWorld('electronAPI', {
    // Platform information
    platform: process.platform,

    // Version info
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    },

    // System information
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

    // File operations
    saveFile: (data, filename) => ipcRenderer.invoke('save-file', data, filename),

    // External links
    openExternal: (url) => ipcRenderer.send('open-external', url),

    // Navigation (from menu)
    onNavigate: (callback) => {
        ipcRenderer.on('navigate', (event, route) => callback(route));
    },

    // Auto-update events
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (event, info) => callback(info));
    },

    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', () => callback());
    },

    // App info
    isElectron: true,
    isDevelopment: process.env.NODE_ENV === 'development'
});

// Log that preload script loaded
console.log('✅ Electron preload script loaded');
console.log('   Platform:', process.platform);
console.log('   Electron:', process.versions.electron);
