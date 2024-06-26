const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  cancelBluetoothRequest: () => ipcRenderer.send("cancel-bluetooth-request"),
  bluetoothPairingRequest: (callback) =>
    ipcRenderer.on("bluetooth-pairing-request", () => callback()),
  bluetoothPairingResponse: (response) =>
    ipcRenderer.send("bluetooth-pairing-response", response),
});

contextBridge.exposeInMainWorld("electron", {
  startDrag: (fileName) => {
    ipcRenderer.send("ondragstart", path.join(process.cwd(), fileName));
  },
});
