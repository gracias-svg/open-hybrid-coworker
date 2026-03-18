const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");
const fetch = require("node-fetch");

let mainWindow;

/*
====================================
CREATE WINDOW
====================================
*/

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {

      preload: path.join(__dirname, "preload.js"),

      // IMPORTANT FIXES
      nodeIntegration: false,
      contextIsolation: true,

      // REQUIRED FOR OCC
      sandbox: false,

      // Allow local file scripts
      webSecurity: false
    }

  });

  const rendererPath = path.join(__dirname, "renderer", "index.html");

  console.log("Loading renderer from:", rendererPath);

  mainWindow.loadFile(rendererPath);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {

    if (!url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }

  });

}

/*
====================================
PERMISSION IPC HANDLERS
====================================
*/

ipcMain.on("permission:approve", async (event, data) => {

  try {

    await fetch("http://localhost:3001/permission/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

  } catch (err) {

    console.error("Permission forwarding failed:", err);

  }

});

ipcMain.on("permission:deny", async (event, data) => {

  try {

    await fetch("http://localhost:3001/permission/deny", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

  } catch (err) {

    console.error("Permission forwarding failed:", err);

  }

});

/*
====================================
APP LIFECYCLE
====================================
*/

app.whenReady().then(() => {

  createWindow();

  app.on("activate", () => {

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }

  });

});

app.on("window-all-closed", () => {

  if (process.platform !== "darwin") {
    app.quit();
  }

});
