// alarm.js

// Simple alarm sound using built-in HTML5 Audio
let alarmAudio = null;
let alarmTimeout = null;

// Change this to a path to your alarm file (WAV/MP3)
// Put the file in the project root or use absolute path
const alarmSoundPath = '../alarms/alarm-radar.mp3';

function playAlarm(delayMs = 1) {
  if (alarmAudio) stopAlarm(); // Reset if already playing

  // Simulate delay before ringing
  alarmTimeout = setTimeout(() => {
    alarmAudio = new Audio(alarmSoundPath);
    alarmAudio.loop = true;
    alarmAudio.play().catch(err => {
      console.error("Failed to play alarm sound:", err);
    });

    console.log("Alarm ringing!");
  }, delayMs); // Demo purpose: default 3s delay
}

function stopAlarm() {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmAudio = null;
    console.log("Alarm stopped.");
  }
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
}

// Make available to index.js (renderer)
window.playAlarm = playAlarm;
window.stopAlarm = stopAlarm;
