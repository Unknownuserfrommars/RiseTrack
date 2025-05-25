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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface HistoryRecord {
  date: string
  time: string
  snoozeTime?: number // 赖床时间（秒）
}

const historyRecords = ref<HistoryRecord[]>([])
const isOpen = ref(false)

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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 1000;
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
  background: rgba(255, 255, 255, 0.1);
  width: fit-content;
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
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #fff;
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
</style> 