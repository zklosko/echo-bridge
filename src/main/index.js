import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EchoServer } from './server.js';
import {
  getSettings,
  setPort,
  setEOM,
  getSubscribers,
  setSubscribers,
} from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let host;

function serializeSpace(space) {
  return {
    zones: Object.fromEntries(space.zones),
    preset: space.preset,
    sequence: space.sequence,
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed?
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  const { port, eom } = getSettings();
  const subscribers = getSubscribers();

  host = new EchoServer({ listenPort: port, eom: eom, subscribers });

  host.on('log', entry => {
    mainWindow?.webContents.send('log', entry);
  });

  host.on('statusChange', (spaceId, space) => {
    mainWindow?.webContents.send('status-change', {
      spaceId,
      space: serializeSpace(space),
    });
  });

  ipcMain.handle('get-settings', () => ({ port: host.port, eom: host.eom }));

  ipcMain.handle('set-port', async (_evt, port) => {
    await host.updatePort(port);
    setPort(port);
    return { port: host.port };
  });

  ipcMain.handle('set-eom', (_evt, eom) => {
    host.eom = eom;
    setEOM(eom);
    return { eom: host.eom };
  });

  ipcMain.handle('add-subscriber', (_evt, { address, port }) => {
    host.addSubscriber(address, port);
    setSubscribers(host.listSubscribers());
    return host.listSubscribers();
  });

  ipcMain.handle(
    'update-subscriber',
    (_evt, { oldAddress, oldPort, newAddress, newPort }) => {
      host.updateSubscriber(oldAddress, oldPort, newAddress, newPort);
      setSubscribers(host.listSubscribers());
      return host.listSubscribers();
    },
  );

  ipcMain.handle('remove-subscriber', (_evt, { address, port }) => {
    host.removeSubscriber(address, port);
    setSubscribers(host.listSubscribers());
    return host.listSubscribers();
  });

  ipcMain.handle('get-space', (_evt, spaceId) => {
    return serializeSpace(host.state.getSpace(spaceId));
  });

  ipcMain.handle('get-subscribers', () => {
    // setSubscribers(host.listSubscribers())  // persist
    return host.listSubscribers();
  });

  createWindow();
});

app.on('before-quit', () => {
  host?.close();
});

// Don't quit the app if all windows are closed while on MacOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
