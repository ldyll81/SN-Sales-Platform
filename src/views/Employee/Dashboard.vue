<template>
  <div class="layout-wrapper">
    <!-- Top Navigation -->
    <div class="top-nav">
      <div class="nav-left">
        <div class="brand">
          <el-icon :size="24"><Connection /></el-icon>
          <span class="brand-text">圣农智能销售指挥平台</span>
        </div>
      </div>
      <div class="nav-center">
        <div class="tab-group">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-item', { active: activeTab === tab.key }]"
            @click="switchTab(tab.route)"
          >
            <el-icon :size="18"><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </div>
        </div>
      </div>
      <div class="nav-right">
        <div class="user-info">
          <el-avatar :size="36" style="background: linear-gradient(135deg, #1a56db, #3b82f6);">
            {{ user?.name?.[0] || '员' }}
          </el-avatar>
          <span class="user-name">{{ user?.name || '员工' }}</span>
        </div>
        <el-button text style="color: #94a3b8;" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-area">
      <!-- 天启 Tab Content -->
      <div v-if="activeTab === 'tianqi'" class="tianqi-page">
        <!-- Welcome Banner -->
        <div class="welcome-banner">
          <div class="welcome-text">
            <h2>👋 上午好，{{ user?.name }}</h2>
            <p class="welcome-date">{{ today }}</p>
          </div>
          <div class="ai-tip">
            <el-tag type="warning" effect="dark" class="ai-tag">AI建议</el-tag>
            <span class="tip-text">本月目标完成率92.4%，建议重点关注盒马鲜生补货确认与大润发季度对账</span>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="stat-row">
          <div class="stat-card blue">
            <div class="stat-icon"><el-icon :size="24"><Money /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ targetProgress.completed }}<span class="stat-unit">万元</span></div>
              <div class="stat-label">本月销售额</div>
              <div class="stat-trend up">↑ 12.5%</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><el-icon :size="24"><CircleCheck /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ targetProgress.rate }}<span class="stat-unit">%</span></div>
              <div class="stat-label">目标完成率（目标{{ targetProgress.monthlyTarget }}万）</div>
              <div class="stat-progress">
                <el-progress :percentage="targetProgress.rate" :show-text="false" :stroke-width="6" />
              </div>
            </div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon"><el-icon :size="24"><Trophy /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">第{{ rankData.rank }}<span class="stat-unit">名 / {{ rankData.totalEmployees }}人</span></div>
              <div class="stat-label">区域销售排名（前{{ rankData.percentile }}%）</div>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><el-icon :size="24"><List /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ todoList.filter(t => !t.done).length }}<span class="stat-unit">项</span></div>
              <div class="stat-label">今日待办</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions & Charts -->
        <div class="content-row">
          <div class="quick-actions-card">
            <h4>快捷操作</h4>
            <div class="action-grid">
              <div class="action-item" @click="switchTab('/employee/upload')">
                <div class="action-icon upload-bg"><el-icon :size="22"><Upload /></el-icon></div>
                <span>上传数据</span>
              </div>
              <div class="action-item" @click="openAssistant">
                <div class="action-icon chat-bg"><el-icon :size="22"><ChatDotRound /></el-icon></div>
                <span>智能分析</span>
              </div>
              <div class="action-item">
                <div class="action-icon chart-bg"><el-icon :size="22"><DataAnalysis /></el-icon></div>
                <span>查看报表</span>
              </div>
              <div class="action-item">
                <div class="action-icon setting-bg"><el-icon :size="22"><Setting /></el-icon></div>
                <span>个人设置</span>
              </div>
            </div>
          </div>
          <div class="trend-card">
            <h4>近6个月销售额趋势</h4>
            <div ref="trendChartRef" class="mini-chart"></div>
          </div>
        </div>

        <!-- AI日报 + 今日待办 -->
        <div class="bottom-row">
          <div class="daily-report-card">
            <h4>
              <el-icon :size="18"><MagicStick /></el-icon>
              AI工作日报
            </h4>
            <template v-if="!reportShown">
              <p class="report-hint">天启已根据今日聊天记录 + 拜访数据，可一键生成结构化日报，全程约3分钟。</p>
              <div class="report-hint-tags">
                <span>今日拜访</span><span>客户反馈</span><span>竞品动态</span><span>明日计划</span>
              </div>
              <el-button type="primary" class="gen-report-btn" @click="generateReport">
                <el-icon><MagicStick /></el-icon>
                一键生成日报
              </el-button>
            </template>
            <template v-else>
              <div class="report-block">
                <div class="report-section">
                  <span class="report-label">今日拜访</span>
                  <span v-for="(v, i) in report.visits" :key="i" class="report-line">· {{ v }}</span>
                </div>
                <div class="report-section">
                  <span class="report-label">客户反馈</span>
                  <span v-for="(v, i) in report.feedback" :key="i" class="report-line">· {{ v }}</span>
                </div>
                <div class="report-section">
                  <span class="report-label">竞品动态</span>
                  <span v-for="(v, i) in report.competitor" :key="i" class="report-line">· {{ v }}</span>
                </div>
                <div class="report-section">
                  <span class="report-label">明日计划</span>
                  <span v-for="(v, i) in report.tomorrow" :key="i" class="report-line">· {{ v }}</span>
                </div>
              </div>
              <div class="report-actions">
                <el-button type="primary" @click="submitReport">
                  <el-icon><CircleCheck /></el-icon>
                  确认提交
                </el-button>
                <el-button @click="reportShown = false">
                  <el-icon><Refresh /></el-icon>
                  重新生成
                </el-button>
              </div>
            </template>
          </div>

          <div class="todo-card">
            <h4>
              <el-icon :size="18"><List /></el-icon>
              今日待办
            </h4>
            <div class="todo-list">
              <div
                v-for="t in todoList"
                :key="t.id"
                class="todo-item"
                :class="{ done: t.done }"
                @click="toggleTodo(t.id)"
              >
                <el-checkbox :model-value="t.done" @click.stop />
                <span class="todo-text">{{ t.text }}</span>
                <span class="todo-time">{{ t.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Tab Content (via router-view) -->
      <router-view v-else />
    </div>

    <!-- Tianqi Float -->
    <TianqiFloat />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import TianqiFloat from '../../components/TianqiFloat.vue'
import {
  Connection, SwitchButton, Money, CircleCheck, Trophy, List,
  Upload, ChatDotRound, DataAnalysis, Setting, Promotion, TrendCharts,
  MagicStick, Refresh
} from '@element-plus/icons-vue'
import { employeeSalesData, employeeRankData, targetProgress, todos, dailyReport } from '../../mock/data'
import { useTianqi } from '../../composables/useTianqi'

const router = useRouter()
const route = useRoute()
const { openTianqi } = useTianqi()

const trendChartRef = ref(null)
let trendChartInstance = null

const userStr = sessionStorage.getItem('currentUser')
const user = userStr ? JSON.parse(userStr) : {}

const rankData = employeeRankData
const todoList = ref(todos.map(t => ({ ...t })))
const report = dailyReport
const reportShown = ref(false)

function toggleTodo(id) {
  const t = todoList.value.find(i => i.id === id)
  if (t) t.done = !t.done
}

function generateReport() {
  reportShown.value = true
}

function submitReport() {
  reportShown.value = false
  ElMessage.success('日报已提交，自动归档至多维表格')
}

const today = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
})

const tabs = [
  { key: 'tianqi', label: '首页', route: '/employee/tianqi', icon: Promotion },
  { key: 'upload', label: '数据上传', route: '/employee/upload', icon: Upload },
  { key: 'profile', label: '我的', route: '/employee/profile', icon: User },
]

import { User } from '@element-plus/icons-vue'

const activeTab = computed(() => {
  const path = route.path
  if (path.includes('tianqi')) return 'tianqi'
  if (path.includes('upload')) return 'upload'
  if (path.includes('profile')) return 'profile'
  return 'tianqi'
})

function switchTab(routePath) {
  router.push(routePath)
}

function openAssistant() {
  openTianqi()
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    sessionStorage.removeItem('currentUser')
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

function initTrendChart() {
  if (!trendChartRef.value) return
  trendChartInstance = echarts.init(trendChartRef.value)
  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '3%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: employeeSalesData.months,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'line',
      data: employeeSalesData.amounts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#3b82f6', width: 3 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
        ])
      },
      itemStyle: { color: '#3b82f6' }
    }]
  })
}

onMounted(() => {
  setTimeout(initTrendChart, 100)
})

watch(activeTab, (val) => {
  if (val === 'tianqi') {
    setTimeout(initTrendChart, 200)
  }
})

onUnmounted(() => {
  trendChartInstance?.dispose()
})
</script>

<style scoped>
.layout-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f5ff;
}

/* Top Navigation */
.top-nav {
  height: 64px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  z-index: 10;
  flex-shrink: 0;
}

.nav-left {
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1a56db;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 1px;
}

.nav-center {
  display: flex;
  align-items: center;
}

.tab-group {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
  transition: all 0.2s;
  user-select: none;
}

.tab-item:hover {
  color: #1a56db;
}

.tab-item.active {
  background: white;
  color: #1a56db;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(26, 86, 219, 0.12);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

/* Main Area */
.main-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

/* Welcome Banner */
.welcome-banner {
  background: linear-gradient(135deg, #1e3a8a, #1a56db, #3b82f6);
  border-radius: 16px;
  padding: 28px 32px;
  color: white;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.welcome-banner::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  top: -50px;
  right: 50px;
}

.welcome-text h2 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 6px;
}

.welcome-date {
  font-size: 13px;
  opacity: 0.8;
}

.ai-tip {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.12);
  padding: 10px 16px;
  border-radius: 8px;
}

.ai-tag {
  flex-shrink: 0;
}

.tip-text {
  font-size: 13px;
  opacity: 0.9;
}

/* Stat Cards */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(26, 86, 219, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.blue .stat-icon { background: #eff6ff; color: #1a56db; }
.green .stat-icon { background: #ecfdf5; color: #10b981; }
.orange .stat-icon { background: #fff7ed; color: #f59e0b; }
.purple .stat-icon { background: #f5f3ff; color: #8b5cf6; }

.stat-body {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
}

.stat-trend.up { color: #10b981; }

/* Content Row */
.content-row {
  display: flex;
  gap: 24px;
}

.quick-actions-card, .trend-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
}

.quick-actions-card {
  width: 340px;
  flex-shrink: 0;
}

.trend-card {
  flex: 1;
}

.quick-actions-card h4, .trend-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f1f5f9;
}

.action-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  transform: translateY(-1px);
}

.action-item span {
  font-size: 12px;
  color: #64748b;
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-bg { background: #eff6ff; color: #1a56db; }
.chat-bg { background: #ecfdf5; color: #10b981; }
.chart-bg { background: #fff7ed; color: #f59e0b; }
.setting-bg { background: #f5f3ff; color: #8b5cf6; }

.mini-chart {
  width: 100%;
  height: 200px;
}

.stat-progress {
  margin-top: 10px;
}

/* AI日报 + 今日待办 */
.bottom-row {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.daily-report-card, .todo-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
}

.daily-report-card {
  flex: 1.4;
}

.todo-card {
  flex: 1;
}

.daily-report-card h4, .todo-card h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.report-hint {
  font-size: 13px;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 12px;
}

.report-hint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.report-hint-tags span {
  font-size: 12px;
  color: #1a56db;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  padding: 3px 12px;
}

.gen-report-btn {
  height: 40px;
  border-radius: 8px;
}

.report-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.report-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
}

.report-label {
  font-size: 12px;
  font-weight: 600;
  color: #1a56db;
}

.report-line {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

.report-actions {
  display: flex;
  gap: 10px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.todo-item:hover {
  background: #f8fafc;
}

.todo-item.done .todo-text {
  text-decoration: line-through;
  color: #94a3b8;
}

.todo-text {
  flex: 1;
  font-size: 13px;
  color: #1e293b;
}

.todo-time {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}
</style>
