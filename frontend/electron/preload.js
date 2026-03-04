const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Platform info
    platform: process.platform,

    // Native notifications
    showNotification: (title, body) => {
        return ipcRenderer.invoke('show-notification', { title, body });
    },

    // File system operations
    saveFile: (filename, data) => {
        return ipcRenderer.invoke('save-file', { filename, data });
    },

    // Navigation listener
    onNavigate: (callback) => {
        ipcRenderer.on('navigate', (event, route) => callback(route));
    },

    // Remove navigation listener
    removeNavigateListener: () => {
        ipcRenderer.removeAllListeners('navigate');
    }
});
