<template>
  <div class="analysis-result" v-if="result">
    <div class="analysis-header">
      <h3>AI 分析结果</h3>
      <button class="close-button" @click="$emit('close')">×</button>
    </div>
    <div class="analysis-content">
      {{ result }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  result: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.analysis-result {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* 使用多层背景实现模糊效果 */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1));
}

.analysis-result::before {
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

.analysis-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem 1rem 0 0;
  position: relative;
  z-index: 1;
}

.analysis-header h3 {
  color: #fff;
  margin: 0;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 5px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.close-button:hover {
  opacity: 1;
}

.analysis-content {
  padding: 15px;
  color: #fff;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 1rem 1rem;
  position: relative;
  z-index: 1;
}

.analysis-content::-webkit-scrollbar {
  width: 6px;
}

.analysis-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.analysis-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.analysis-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style> 