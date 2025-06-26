const { app, BrowserWindow } = require('electron');
const path = require('path');
const createServer = require('./backend');

let server;

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(`http://localhost:${port}/docs/login.html`);
}

app.whenReady().then(() => {
  const { httpServer } = createServer();
  server = httpServer.listen(0, () => {
    const port = server.address().port;
    createWindow(port);
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});
