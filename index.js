const { app, BrowserWindow, ipcMain } = require("electron/main");
const path = require("node:path");
const fs = require("node:fs");
const https = require("node:https");

let bluetoothPinCallback;
let selectBluetoothCallback;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      selectBluetoothCallback = callback;
      const result = deviceList.find((device) => {
        return device.deviceName === "test";
      });
      if (result) {
        callback(result.deviceId);
      } else {
        // The device wasn't found so we need to either wait longer (eg until the
        // device is turned on) or until the user cancels the request
      }
    }
  );

  ipcMain.on("cancel-bluetooth-request", (event) => {
    selectBluetoothCallback("");
  });

  // Listen for a message from the renderer to get the response for the Bluetooth pairing.
  ipcMain.on("bluetooth-pairing-response", (event, response) => {
    bluetoothPinCallback(response);
  });

  mainWindow.webContents.session.setBluetoothPairingHandler(
    (details, callback) => {
      bluetoothPinCallback = callback;
      // Send a message to the renderer to prompt the user to confirm the pairing.
      mainWindow.webContents.send("bluetooth-pairing-request", details);
    }
  );

  mainWindow.loadFile("index.html");
}

// Create a new file to copy - you can also copy existing files.
const iconName = path.join(__dirname, "iconForDragAndDrop.png");
const icon = fs.createWriteStream(iconName);

fs.writeFileSync(
  path.join(__dirname, "drag-and-drop-1.md"),
  "# First file to test drag and drop"
);
fs.writeFileSync(
  path.join(__dirname, "drag-and-drop-2.md"),
  "# Second file to test drag and drop"
);

https.get("https://img.icons8.com/ios/452/drag-and-drop.png", (response) => {
  response.pipe(icon);
});

app.whenReady().then(() => {
  createWindow();
  ipcMain.on("ondragstart", (event, filePath) => {
    event.sender.startDrag({
      file: path.join(__dirname, filePath),
      icon: iconName,
    });
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
