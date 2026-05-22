'use strict';

const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');

// Single instance lock — focus existing window if user double-launches
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

const PORT = 3001;
let mainWindow = null;

// Disable any Google Safe Browsing or update pings — we want 100% offline
app.commandLine.appendSwitch('disable-features', 'AutoupgradeMixedContent,CertificateTransparencyComponentUpdater');
app.commandLine.appendSwitch('no-proxy-server');

function waitForServer(maxAttempts = 40) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function check() {
      const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on('error', retry);
      req.setTimeout(500, () => { req.destroy(); retry(); });
    }
    function retry() {
      if (++attempts >= maxAttempts) return reject(new Error(`Server did not start after ${maxAttempts} attempts`));
      setTimeout(check, 300);
    }
    check();
  });
}

app.whenReady().then(async () => {
  // Data lives in the OS user-data folder so it survives app updates
  const dataDir = path.join(app.getPath('userData'), 'data');
  process.env.DATA_DIR = dataDir;

  const isPackaged = app.isPackaged;

  // In production, static client files are in resources/client/
  const clientDist = isPackaged
    ? path.join(process.resourcesPath, 'client')
    : null; // dev: Vite serves on 5173; leave null so Express doesn't serve statics

  if (clientDist) process.env.CLIENT_DIST = clientDist;

  // Load and start the Express server using Electron's Node.js runtime
  const serverEntry = isPackaged
    ? path.join(__dirname, 'server-dist', 'index.js')   // inside app.asar / app/
    : path.join(__dirname, '..', 'server', 'dist', 'index.js'); // dev: compiled JS

  try {
    const { startServer } = require(serverEntry);
    await startServer(PORT, clientDist ?? undefined);
  } catch (err) {
    await dialog.showErrorBox('Startup error', String(err));
    app.quit();
    return;
  }

  // Wait until the server is accepting connections
  try {
    await waitForServer();
  } catch (err) {
    await dialog.showErrorBox('Server timeout', String(err));
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0e1a',
    title: 'Game Ledger',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Block any web-accessible resource from making external requests
      webSecurity: true,
    },
  });

  // In dev, Vite runs the frontend. In prod, Express serves it.
  const url = isPackaged
    ? `http://127.0.0.1:${PORT}`
    : (process.env.VITE_URL || `http://127.0.0.1:5173`);

  mainWindow.loadURL(url);

  // Open links that explicitly target _blank in the system browser, not in-app
  mainWindow.webContents.setWindowOpenHandler(({ url: href }) => {
    shell.openExternal(href);
    return { action: 'deny' };
  });

  // Block any navigation away from localhost (defence-in-depth)
  mainWindow.webContents.on('will-navigate', (event, href) => {
    const allowed = href.startsWith(`http://127.0.0.1:${PORT}`) ||
                    href.startsWith('http://localhost:');
    if (!allowed) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
