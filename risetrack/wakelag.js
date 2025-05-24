// wakeLag.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'wake_lags.json');

// Ensure data file exists
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
}

// Save a new wake lag entry (in minutes)
function logWakeLag(minutes) {
  ensureDataFile();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  data.push({ timestamp: Date.now(), lag: minutes });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`Logged wake lag: ${minutes} minutes`);
}

// Load all wake lag data
function loadWakeLags() {
  ensureDataFile();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return data.map(entry => entry.lag);
}

function getAverageWakeLag() {
  const lags = loadWakeLags();
  if (!lags.length) return 0;
  const sum = lags.reduce((a, b) => a + b, 0);
  return Math.round(sum / lags.length);
}

module.exports = {
  logWakeLag,
  getAverageWakeLag,
  loadWakeLags,
};
