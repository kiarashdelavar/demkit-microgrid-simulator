"use strict";

// Internal Windows-only packaging proof of concept.
// Electron supplies the Node.js runtime for the inherited Express server.
// The Python executable and input model are added as extraResources.

const { app, BrowserWindow, dialog } = require("electron");
const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

const BACKEND_PORT = 3001;
const WEB_PORT = 3002;
const TIMEOUT_MS = 90000;
let python = null;
let webServer = null;
let window = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function portIsOccupied(port) {
  return new Promise((resolve) => {
    const connection = net.createConnection({ host: "127.0.0.1", port });
    let finished = false;
    const complete = (occupied) => {
      if (finished) return;
      finished = true;
      connection.destroy();
      resolve(occupied);
    };
    connection.setTimeout(750);
    connection.once("connect", () => complete(true));
    connection.once("error", () => complete(false));
    connection.once("timeout", () => complete(false));
  });
}

function httpIsReady(port, require200) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: "127.0.0.1", port, path: "/", timeout: 1200,
    }, (response) => {
      const code = response.statusCode || 0;
      response.resume();
      resolve(require200 ? code === 200 : code >= 200 && code < 500);
    });
    req.once("timeout", () => req.destroy());
    req.once("error", () => resolve(false));
  });
}

async function waitForHttp(port, require200, name) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (python && python.exitCode !== null) {
      throw new Error("The packaged Python backend stopped before startup finished.");
    }
    if (await httpIsReady(port, require200)) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(name + " did not respond in time. Check the packaged backend and data files.");
}

function getWritableRuntime() {
  const bundled = path.join(process.resourcesPath, "runtime");
  const runtime = path.join(app.getPath("userData"), "runtime-" + app.getVersion());
  const complete = path.join(runtime, ".copied-ok");
  if (!fs.existsSync(complete)) {
    // Only our versioned prototype runtime is replaced. Never modify
    // another application directory or the installed Program Files files.
    fs.rmSync(runtime, { recursive: true, force: true });
    fs.cpSync(bundled, runtime, { recursive: true });
    fs.writeFileSync(complete, "packaged runtime copy finished\n");
  }
  return runtime;
}

function createWindow() {
  window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "DEMKit Microgrid Prototype",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== "http://127.0.0.1:3002/" && !url.startsWith("http://127.0.0.1:3002/")) {
      event.preventDefault();
    }
  });
  window.on("closed", () => { window = null; });
}

async function startDesktop() {
  if (!app.isPackaged) {
    throw new Error("This prototype must first be packaged with the Windows build script.");
  }
  if (await portIsOccupied(BACKEND_PORT) || await portIsOccupied(WEB_PORT)) {
    throw new Error("Ports 3001 or 3002 are already in use. Close earlier DEMKit servers first.");
  }

  const backendExe = path.join(process.resourcesPath, "backend", "demkit-backend.exe");
  if (!fs.existsSync(backendExe)) {
    throw new Error("The packaged Python backend is missing. Rebuild the Windows prototype.");
  }

  const runtime = getWritableRuntime();
  const webDir = path.join(runtime, "workspace", "touchtable", "web");
  const webScript = path.join(webDir, "index.js");
  if (!fs.existsSync(webScript)) {
    throw new Error("The packaged web application is missing. Rebuild the prototype.");
  }

  python = childProcess.spawn(backendExe, [], {
    cwd: runtime,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, DEMKIT_RUNTIME_ROOT: runtime },
  });
  python.stdout.on("data", (data) => { console.log("[DEMKit]", String(data)); });
  python.stderr.on("data", (data) => { console.error("[DEMKit]", String(data)); });
  python.on("error", (error) => { console.error("Backend process error:", error.message); });
  await waitForHttp(BACKEND_PORT, false, "DEMKit");

  // Electron already contains Node.js, so there is no separate Node runtime
  // that students need to install. Use the unchanged Express/Socket.IO app.
  process.env.DEM_HOST = "127.0.0.1";
  process.env.DEM_PORT = String(BACKEND_PORT);
  process.env.PORT = String(WEB_PORT);
  process.env.WEB_HOST = "127.0.0.1";
  process.chdir(webDir);
  webServer = require(webScript);
  await waitForHttp(WEB_PORT, true, "The web interface");

  createWindow();
  await window.loadURL("http://127.0.0.1:" + WEB_PORT + "/");
}

function stopOwnedServices() {
  if (webServer) {
    try {
      webServer.closeAllConnections?.();
      webServer.close();
    } catch (error) {
      console.error("Could not close web server:", error.message);
    }
    webServer = null;
  }
  if (python && python.pid && python.exitCode === null) {
    // Windows: target only the exact child PID and its process tree.
    // Never kill by executable name (other Python processes may be unrelated).
    childProcess.spawnSync("taskkill", ["/PID", String(python.pid), "/T", "/F"], {
      windowsHide: true, timeout: 5000, stdio: "ignore",
    });
  }
  python = null;
}

app.on("will-quit", stopOwnedServices);
app.on("window-all-closed", () => app.quit());

app.whenReady().then(startDesktop).catch((error) => {
  console.error("DEMKit desktop startup failed:", error);
  dialog.showErrorBox(
    "DEMKit could not start",
    error.message + "\n\nThis is an internal Windows prototype, not a released installer.",
  );
  app.quit();
});
