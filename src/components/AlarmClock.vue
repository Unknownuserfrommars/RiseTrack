<template>
  <div class="alarm-clock" :class="{ 'alarm-active': isAlarmActive }">
    <div class="time-display" v-if="!isAlarmActive">
      <div class="current-time">{{ currentTime }}</div>
      <div class="alarm-time" v-if="alarmTime">
        闹钟时间: {{ alarmTime }}
        <span v-if="aiOffset > 0" class="ai-offset">
          (AI 建议提前 {{ aiOffset }} 分钟)
        </span>
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
      <div class="alarm-text">时间到!</div>
      <div class="alarm-hint">点击任意位置停止</div>
    </div>

    <HistoryList ref="historyListRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import HistoryList from './HistoryList.vue'

const currentTime = ref('')
const selectedTime = ref('')
const alarmTime = ref('')
const isAlarmActive = ref(false)
const showHistory = ref(false)
const aiOffset = ref(0) // AI 建议的偏移时间（分钟）
let timer: number | null = null
let alarmAudio: HTMLAudioElement | null = null
let historyListRef = ref<InstanceType<typeof HistoryList> | null>(null)
let alarmStartTime: number | null = null

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

const addToHistory = () => {
  const now = new Date()
  const record = {
    date: now.toISOString(),
    time: now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    snoozeTime: alarmStartTime ? Math.floor((Date.now() - alarmStartTime) / 1000) : undefined
  }
  
  const stored = localStorage.getItem('alarmHistory')
  const history = stored ? JSON.parse(stored) : []
  history.unshift(record)
  
  // 只保留最近30条记录
  const trimmedHistory = history.slice(0, 30)
  localStorage.setItem('alarmHistory', JSON.stringify(trimmedHistory))
  
  // 刷新历史记录列表
  if (historyListRef.value) {
    historyListRef.value.loadHistory()
  }
  
  // 重置闹钟开始时间
  alarmStartTime = null
}

const analyzeAndAdjustAlarm = async () => {
  try {
    // 获取最近7天的数据
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const stored = localStorage.getItem('alarmHistory')
    if (!stored) return
    
    const history = JSON.parse(stored)
    const recentRecords = history.filter((record: any) => {
      const recordDate = new Date(record.date)
      return recordDate >= sevenDaysAgo
    })

    if (recentRecords.length === 0) return

    // 准备发送给 OpenAI 的数据
    const analysisData = {
      records: recentRecords.map((record: any) => ({
        date: new Date(record.date).toLocaleDateString('zh-CN'),
        time: record.time,
        snoozeTime: record.snoozeTime
      }))
    }

    // 调用 OpenAI API 获取建议
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-zpccrwrvzrwlbrltwtumawdxpyhtekmfkrxpfidlvovsbxwn'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen3-8B",
        messages: [
          {
            role: "system",
            content: "你是一个专业的睡眠分析助手。请分析用户的起床记录，并给出一个建议的闹钟提前时间（以分钟为单位）。只需要返回一个数字，不要其他文字。例如：15"
          },
          {
            role: "user",
            content: `请分析以下最近7天的起床记录数据，并给出建议的闹钟提前时间：${JSON.stringify(analysisData, null, 2)}`
          }
        ]
      })
    })

    const data = await response.json()
    const suggestedOffset = parseInt(data.choices[0].message.content)
    
    if (!isNaN(suggestedOffset)) {
      aiOffset.value = suggestedOffset
      // 如果当前有闹钟设置，则应用偏移
      if (selectedTime.value) {
        const [hours, minutes] = selectedTime.value.split(':')
        const date = new Date()
        date.setHours(parseInt(hours))
        date.setMinutes(parseInt(minutes) - suggestedOffset)
        
        // 格式化新的时间
        const newHours = date.getHours().toString().padStart(2, '0')
        const newMinutes = date.getMinutes().toString().padStart(2, '0')
        selectedTime.value = `${newHours}:${newMinutes}`
        
        // 如果闹钟已设置，更新闹钟时间
        if (alarmTime.value) {
          alarmTime.value = selectedTime.value
        }
      }
    }
  } catch (error) {
    console.error('AI 分析失败:', error)
  }
}

const stopAlarm = () => {
  if (alarmAudio) {
    alarmAudio.pause()
    alarmAudio.currentTime = 0
  }
  isAlarmActive.value = false
  alarmTime.value = ''
  addToHistory()
  analyzeAndAdjustAlarm() // 添加 AI 分析
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
    alarmStartTime = Date.now() // 记录闹钟开始时间
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

.ai-offset {
  font-size: 0.8em;
  color: #4CAF50;
  margin-left: 10px;
  opacity: 0.8;
}
</style> 