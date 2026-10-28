<template>
  <router-view />
  <!-- 数据同步按钮 -->
  <div v-if="showSyncBtn" class="sync-float-btn" @click="handleSync" :title="syncing ? '同步中...' : '从多维表格同步数据'">
    <el-icon :size="18" :class="{ spinning: syncing }"><Refresh /></el-icon>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const syncing = ref(false)

const showSyncBtn = computed(() => {
  return route.path !== '/login' && route.path !== '/'
})

async function handleSync() {
  if (syncing.value) return
  syncing.value = true
  try {
    const res = await fetch('/api/sync', { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      ElMessage.success(`同步完成：异常${data.anomaly}条 知识${data.knowledge}条 销售${data.sales}条`)
      // 强制刷新页面以加载新数据
      setTimeout(() => window.location.reload(), 800)
    } else {
      ElMessage.error('同步失败: ' + (data.error || '未知错误'))
    }
  } catch (err) {
    ElMessage.error('同步失败: ' + err.message)
  } finally {
    syncing.value = false
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
  background-color: #f0f5ff;
  color: #1e293b;
}

:root {
  --primary: #1a56db;
  --primary-hover: #1e40af;
  --primary-light: #dbeafe;
  --primary-lighter: #eff6ff;
  --primary-gradient: linear-gradient(135deg, #1a56db, #3b82f6);
  --bg-page: #f0f5ff;
  --bg-card: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --shadow-card: 0 2px 12px rgba(26, 86, 219, 0.08);
  --shadow-hover: 0 4px 20px rgba(26, 86, 219, 0.12);
}

/* 同步按钮 */
.sync-float-btn {
  position: fixed;
  bottom: 40px;
  right: 120px;
  z-index: 999;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}
.sync-float-btn:hover {
  color: #1a56db;
  border-color: #1a56db;
  box-shadow: 0 4px 16px rgba(26, 86, 219, 0.2);
  transform: translateY(-1px);
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
