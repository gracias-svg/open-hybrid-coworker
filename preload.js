const { contextBridge, ipcRenderer } = require("electron");

/*
=====================================
OCC ELECTRON PRELOAD BRIDGE
=====================================
Secure communication between
renderer and backend
*/

contextBridge.exposeInMainWorld("api", {

  /*
  ================================
  APPROVE PERMISSION
  ================================
  */

  approvePermission: (action, details) => {

    ipcRenderer.send("permission:approve", {
      action,
      details
    });

  },

  /*
  ================================
  DENY PERMISSION
  ================================
  */

  denyPermission: (action) => {

    ipcRenderer.send("permission:deny", {
      action
    });

  }

});