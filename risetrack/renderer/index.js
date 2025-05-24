// renderer/index.js
window.addEventListener('DOMContentLoaded', () => {
  const stopButton = document.getElementById('stopButton');
  const wakeTimeInput = document.getElementById('wakeTime');
  const status = document.getElementById('status');

  let alarmTime = null;
  let alarmStartTime = null;
  let countdown = null;

  wakeTimeInput.addEventListener('change', () => {
    const wakeTime = wakeTimeInput.value;
    if (!wakeTime) return;

    const [hour, minute] = wakeTime.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(hour, minute, 0, 0);
    if (targetTime < now) targetTime.setDate(targetTime.getDate() + 1);

    let avgLag = 0;
    try {
      avgLag = window.smartAlarmAPI?.getAverageWakeLag?.() || 0;
    } catch (err) {
      console.error("Failed to load wake lag:", err);
      avgLag = 0;
    }

    alarmTime = new Date(targetTime.getTime() - avgLag * 60000);
    alarmStartTime = alarmTime;

    const msUntilAlarm = alarmTime - now;
    status.textContent = `Alarm set for ${alarmTime.toLocaleTimeString()} (wake target: ${wakeTime})`;

    if (countdown) clearInterval(countdown); // Clear any previous countdown

    countdown = setInterval(() => {
      const nowTick = new Date();
      const diffMs = alarmTime - nowTick;

      if (diffMs <= 0) {
        clearInterval(countdown);
        if (typeof playAlarm === 'function') {
          playAlarm();
          status.textContent = '⏰ Alarm ringing! Tap "I\'m Awake!" when ready.';
        }
        return;
      }

      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      status.textContent = `⏳ Alarm in ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
  });

  stopButton.addEventListener('click', () => {
    if (typeof stopAlarm === 'function') {
      stopAlarm();
      const now = new Date();
      const diffMs = now - alarmStartTime;
      const lagMin = Math.floor(diffMs / 60000);
      const lagSec = Math.floor((diffMs % 60000) / 1000);

      // Log only full minutes for wake lag history
      window.smartAlarmAPI?.logWakeLag?.(lagMin);

      status.textContent = `✅ Alarm stopped. Wake lag recorded: ${lagMin} min ${lagSec} sec`;

      if (countdown) clearInterval(countdown);
    } else {
      status.textContent = '⚠️ No alarm active.';
    }
  });
});
