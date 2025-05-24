<template>
  <div class="alarm-clock" :class="{ 'alarm-active': isAlarmActive }">
    <div class="time-display" v-if="!isAlarmActive">
      <div class="current-time">{{ currentTime }}</div>
      <div class="alarm-time" v-if="alarmTime">
        闹钟时间: {{ alarmTime }}
      </div>
    </div>
    
    <div class="controls" v-if="!isAlarmActive">
      <input 
        type="time" 
        v-model="selectedTime"
        class="time-input"
      >
      <button 
        @click="setAlarm" 
        class="set-button"
        :disabled="!selectedTime"
      >
        {{ alarmTime ? '取消闹钟' : '设置闹钟' }}
      </button>
    </div>

    <div class="alarm-alert" v-if="isAlarmActive" @click="stopAlarm">
      <div class="alarm-text">时间到！</div>
      <div class="alarm-hint">点击任意位置停止</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const selectedTime = ref('')
const alarmTime = ref('')
const isAlarmActive = ref(false)
let timer: number | null = null
let alarmAudio: HTMLAudioElement | null = null

// 预加载音频
const preloadAlarmSound = () => {
  alarmAudio = new Audio('/alarm.mp3')
  alarmAudio.load()
  alarmAudio.addEventListener('error', (e) => {
    console.error('音频加载失败:', e)
  })
}

const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const setAlarm = () => {
  if (alarmTime.value) {
    // 取消闹钟
    alarmTime.value = ''
    if (alarmAudio) {
      alarmAudio.pause()
      alarmAudio.currentTime = 0
    }
  } else {
    // 设置闹钟
    alarmTime.value = selectedTime.value
  }
}

const stopAlarm = () => {
  if (alarmAudio) {
    alarmAudio.pause()
    alarmAudio.currentTime = 0
  }
  isAlarmActive.value = false
  alarmTime.value = ''
}

const checkAlarm = () => {
  if (!alarmTime.value) return
  
  const now = new Date()
  const [hours, minutes] = alarmTime.value.split(':')
  const alarmDate = new Date()
  alarmDate.setHours(parseInt(hours))
  alarmDate.setMinutes(parseInt(minutes))
  alarmDate.setSeconds(0)
  
  if (now.getHours() === alarmDate.getHours() && 
      now.getMinutes() === alarmDate.getMinutes() && 
      now.getSeconds() === 0) {
    // 播放闹钟声音
    if (alarmAudio) {
      alarmAudio.currentTime = 0
      alarmAudio.loop = true
      const playPromise = alarmAudio.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('播放音频失败:', error)
        })
      }
    }
    isAlarmActive.value = true
  }
}

onMounted(() => {
  preloadAlarmSound()
  updateCurrentTime()
  timer = window.setInterval(() => {
    updateCurrentTime()
    checkAlarm()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (alarmAudio) {
    alarmAudio.pause()
  }
})
</script>

<style scoped>
.alarm-clock {
  width: calc(100% - 40px);
  height: calc(100% - 40px);
  margin: 20px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.alarm-clock.alarm-active {
  background: rgba(255, 107, 107, 0.9);
  margin: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.time-display {
  text-align: center;
  margin-bottom: 2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.current-time {
  font-size: clamp(3rem, 15vw, 12rem);
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
  line-height: 1;
}

.alarm-time {
  font-size: clamp(1rem, 4vw, 2.5rem);
  color: #ff6b6b;
  margin-top: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  max-width: 600px;
  margin-top: auto;
  padding: 1rem;
}

.time-input {
  padding: 0.5rem 1rem;
  font-size: clamp(1rem, 2vw, 1.5rem);
  border: none;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  flex: 1;
  max-width: 300px;
}

.set-button {
  padding: 0.5rem 2rem;
  font-size: clamp(1rem, 2vw, 1.5rem);
  border: none;
  border-radius: 0.5rem;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.set-button:hover {
  background: #45a049;
}

.set-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.alarm-alert {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  animation: pulse 1.5s infinite;
}

.alarm-text {
  font-size: clamp(4rem, 20vw, 15rem);
  font-weight: bold;
  color: white;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  margin-bottom: 2rem;
}

.alarm-hint {
  font-size: clamp(1.5rem, 5vw, 3rem);
  color: white;
  opacity: 0.8;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style> 