import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setPort: port => ipcRenderer.invoke('set-port', port),
  setEom: eom => ipcRenderer.invoke('set-eom', eom),
  getSpace: spaceId => ipcRenderer.invoke('get-space', spaceId),

  getSubscribers: () => ipcRenderer.invoke('get-subscribers'),
  addSubscriber: (address, port) =>
    ipcRenderer.invoke('add-subscriber', { address, port }),
  updateSubscriber: (oldAddress, oldPort, newAddress, newPort) =>
    ipcRenderer.invoke('update-subscriber', {
      oldAddress,
      oldPort,
      newAddress,
      newPort,
    }),
  removeSubscriber: (address, port) =>
    ipcRenderer.invoke('remove-subscriber', { address, port }),

  onLog: callback => {
    ipcRenderer.on('log', (_evt, entry) => callback(entry));
  },
  onStatusChange: callback => {
    ipcRenderer.on('status-change', (_evt, payload) => callback(payload));
  },
});
