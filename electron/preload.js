const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    pickFolder: () => ipcRenderer.invoke('pick-folder'),
    trimImages: (options) => ipcRenderer.invoke('trim-images', options),
    onProgress: (cb) => {
        const listener = (_event, payload) => cb(payload);
        ipcRenderer.on('progress:update', listener);
        return () => ipcRenderer.removeListener('progress:update', listener);
    }
});
