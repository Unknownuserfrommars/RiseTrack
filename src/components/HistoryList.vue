<template>
  <div class="history-panel" :class="{ 'history-panel-open': isOpen }">
    <div class="history-header" @click="togglePanel">
      <div class="toggle-icon" :class="{ 'toggle-icon-open': isOpen }">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h2 v-show="isOpen">起床历史记录</h2>
    </div>
    <div class="history-content" v-show="isOpen">
      <div class="history-actions">
        <button 
          class="analyze-button" 
          @click="analyzeRecentData"
          :disabled="isAnalyzing"
        >
          {{ isAnalyzing ? '分析中...' : '分析近七天起床记录' }}
        </button>
      </div>
      <div class="history-items">
        <div v-for="(record, index) in historyRecords" :key="index" class="history-item">
          <div class="record-main">
            <span class="date">{{ formatDate(record.date) }}</span>
            <span class="time">{{ record.time }}</span>
          </div>
          <div class="record-snooze" v-if="record.snoozeTime">
            <span class="snooze-label">赖床时间:</span>
            <span class="snooze-time">{{ formatSnoozeTime(record.snoozeTime) }}</span>
          </div>
        </div>
        <div v-if="historyRecords.length === 0" class="no-records">
          暂无历史记录
        </div>
      </div>
    </div>
    <AnalysisResult 
      v-if="analysisResult" 
      :result="analysisResult"
      @close="analysisResult = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AnalysisResult from './AnalysisResult.vue'

interface HistoryRecord {
  date: string
  time: string
  snoozeTime?: number // 赖床时间（秒）
}

const historyRecords = ref<HistoryRecord[]>([])
const isOpen = ref(false)
const isAnalyzing = ref(false)
const analysisResult = ref('')

const loadHistory = () => {
  const stored = localStorage.getItem('alarmHistory')
  if (stored) {
    historyRecords.value = JSON.parse(stored)
  }
}

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatSnoozeTime = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

const analyzeRecentData = async () => {
  if (isAnalyzing.value) return
  
  isAnalyzing.value = true
  try {
    // 获取最近7天的数据
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentRecords = historyRecords.value.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= sevenDaysAgo
    })

    if (recentRecords.length === 0) {
      analysisResult.value = '最近七天没有起床记录'
      return
    }

    // 准备发送给 OpenAI 的数据
    const analysisData = {
      records: recentRecords.map(record => ({
        date: formatDate(record.date),
        time: record.time,
        snoozeTime: record.snoozeTime
      }))
    }
    console.log(analysisData);
    // 调用 OpenAI API
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
            content: "你是一个专业的睡眠分析助手，请根据用户的起床记录数据，分析其起床习惯，包括起床时间规律、赖床情况等，并给出改善建议。数据单位均为秒，请用中文回答。"
          },
          {
            role: "user",
            content: `请分析以下最近7天的起床记录数据：${JSON.stringify(analysisData, null, 2)}`
          }
        ]
      })
    })

    const data = await response.json()
    analysisResult.value = data.choices[0].message.content
  } catch (error) {
    console.error('分析失败:', error)
    analysisResult.value = '分析失败，请稍后重试'
  } finally {
    isAnalyzing.value = false
  }
}

onMounted(() => {
  loadHistory()
})

// 暴露方法给父组件
defineExpose({
  loadHistory
})
</script>

<style scoped>
.history-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* 使用多层背景实现模糊效果 */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1));
}

.history-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  z-index: -1;
  filter: blur(10px);
}

.history-panel-open {
  width: 400px;
}

.history-header {
  padding: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.3);
  width: fit-content;
  position: relative;
  z-index: 1;
}

.history-header h2 {
  color: #fff;
  margin: 0 0 0 10px;
  font-size: 1.2rem;
  white-space: nowrap;
}

.toggle-icon {
  width: 24px;
  height: 24px;
  color: #fff;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon-open {
  transform: rotate(180deg);
}

.history-content {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 1rem 1rem;
  position: relative;
  z-index: 1;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.record-main {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.record-snooze {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  opacity: 0.8;
}

.snooze-label {
  margin-right: 5px;
}

.snooze-time {
  color: #ff6b6b;
}

.no-records {
  text-align: center;
  color: #fff;
  padding: 20px;
  opacity: 0.7;
}

.date {
  font-weight: 500;
}

.time {
  opacity: 0.8;
}

/* 自定义滚动条样式 */
.history-content::-webkit-scrollbar {
  width: 6px;
}

.history-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.history-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.history-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.history-actions {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.analyze-button {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  position: relative;
  z-index: 1;
}

.analyze-button:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 