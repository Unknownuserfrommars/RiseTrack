// preload.js
const { contextBridge } = require('electron');
const { logWakeLag, getAverageWakeLag } = require('./wakelag.js');

contextBridge.exposeInMainWorld('smartAlarmAPI', {
  logWakeLag,
  getAverageWakeLag
});
