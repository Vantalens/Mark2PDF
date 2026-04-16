import path from "node:path";
import { fileURLToPath } from "node:url";

import { app, BrowserWindow, shell } from "electron";

import { startWebServer } from "./web-server.js";

const startTime = Date.now();

function logTiming(stage) {
  const elapsed = Date.now() - startTime;
  console.log(`[STARTUP] ${stage}: ${elapsed}ms`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverHandle;
let mainWindow;
let creatingWindow = false;

logTiming("electron-main.js module loaded");

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

async function createWindow() {
  logTiming("createWindow() called");
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    return mainWindow;
  }

  if (creatingWindow) {
    return null;
  }

  creatingWindow = true;

  try {
    logTiming("before startWebServer");
    serverHandle = await startWebServer(0);
    logTiming("after startWebServer");
    const url = `http://127.0.0.1:${serverHandle.port}`;

    mainWindow = new BrowserWindow({
      width: 1440,
      height: 980,
      minWidth: 1120,
      minHeight: 760,
      backgroundColor: "#f6f1e8",
      title: "Mark2PDF",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      shell.openExternal(targetUrl);
      return { action: "deny" };
    });

    logTiming("before loadURL");
    await mainWindow.loadURL(url);
    logTiming("after loadURL");

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    return mainWindow;
  } finally {
    creatingWindow = false;
  }
}

app.on("second-instance", () => {
  void createWindow();
});

app.whenReady().then(() => {
  logTiming("app.whenReady");
  if (!hasSingleInstanceLock) {
    return;
  }

  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
      return;
    }

    void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverHandle?.server) {
    serverHandle.server.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverHandle?.server) {
    serverHandle.server.close();
  }
});
