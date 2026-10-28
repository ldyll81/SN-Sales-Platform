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
            {{ user?.name?.[0] || '高' }}
          </el-avatar>
          <span class="user-name">{{ user?.name || '高层' }}</span>
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
            <p class="welcome-date">{{ today }} · 集团运营管理驾驶舱</p>
          </div>
          <div class="ai-tip">
            <el-tag type="warning" effect="dark" class="ai-tag">AI简报</el-tag>
            <span class="tip-text">7月集团总销售额14,200万元，环比下降6.6%，华北、西北承压；AI预判Q4冲刺季整体上行，建议优先处置华南竞品端架争夺与西北价格倒挂。</span>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="stat-row">
          <div class="stat-card blue">
            <div class="stat-icon"><el-icon :size="24"><Money /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ kpiMonthly.value.toLocaleString() }}<span class="stat-unit">万元</span></div>
              <div class="stat-label">集团月度总销售额</div>
              <div class="stat-trend down">↓ 6.6% 环比</div>
            </div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon"><el-icon :size="24"><WarningFilled /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ anomalies.length }}<span class="stat-unit">条</span></div>
              <div class="stat-label">全国异常总数</div>
              <div class="stat-trend down">{{ pendingCount }} 条待处理</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><el-icon :size="24"><Opportunity /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ healthScore.score }}<span class="stat-unit">分</span></div>
              <div class="stat-label">异常处理健康度</div>
              <div class="stat-trend up">{{ healthScore.level }}</div>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><el-icon :size="24"><Aim /></el-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ targetRate }}<span class="stat-unit">%</span></div>
              <div class="stat-label">年度目标完成率</div>
              <div class="stat-progress">
                <el-progress :percentage="targetRate" :show-text="false" :stroke-width="6" />
              </div>
            </div>
          </div>
        </div>

        <!-- 关键经营指标 日/周/月 -->
        <div class="kpi-row">
          <div v-for="k in kpiDailyWeeklyMonthly" :key="k.period" class="kpi-card">
            <span class="kpi-period">{{ k.period }}</span>
            <div class="kpi-value">{{ k.value.toLocaleString() }}<span class="kpi-unit">{{ k.unit }}</span></div>
            <span class="kpi-label">{{ k.label }}</span>
            <span class="kpi-trend" :class="trendClass(k.trend)">{{ k.trend }}</span>
          </div>
        </div>

        <!-- Quick actions & Forecast Chart -->
        <div class="content-row">
          <div class="quick-actions-card">
            <h4>快捷操作</h4>
            <div class="action-grid">
              <div class="action-item" @click="switchTab('/executive/info-summary')">
                <div class="action-icon summary-bg"><el-icon :size="22"><DataBoard /></el-icon></div>
                <span>信息汇总</span>
              </div>
              <div class="action-item" @click="openAssistant">
                <div class="action-icon chat-bg"><el-icon :size="22"><ChatDotRound /></el-icon></div>
                <span>战略分析</span>
              </div>
              <div class="action-item">
                <div class="action-icon chart-bg"><el-icon :size="22"><DataAnalysis /></el-icon></div>
                <span>区域对比</span>
              </div>
              <div class="action-item">
                <div class="action-icon report-bg"><el-icon :size="22"><Document /></el-icon></div>
                <span>集团报告</span>
              </div>
            </div>
          </div>
          <div class="trend-card">
            <div class="card-head">
              <h4>集团全国销售额趋势 · AI 预测</h4>
              <span class="forecast-tag">虚线为 AI 预测 · 淡色带为置信区间</span>
            </div>
            <div ref="trendChartRef" class="mini-chart"></div>
          </div>
        </div>

        <!-- 健康度 + 实时排名 -->
        <div class="bottom-row">
          <div class="health-card">
            <h4>异常处理健康度</h4>
            <div class="health-body">
              <el-progress
                type="circle"
                :percentage="healthScore.score"
                :width="120"
                :stroke-width="10"
                color="#1a56db"
                class="health-ring"
              >
                <span class="health-score">{{ healthScore.score }}<span class="health-unit">分</span></span>
              </el-progress>
              <div class="health-items">
                <div v-for="item in healthScore.items" :key="item.label" class="health-item">
                  <div class="health-item-top">
                    <span>{{ item.label }}</span>
                    <span>{{ item.value }}%</span>
                  </div>
                  <el-progress :percentage="item.value" :show-text="false" :stroke-width="6" :color="healthColor(item.value)" />
                </div>
              </div>
            </div>
          </div>

          <div class="rank-card">
            <div class="card-head">
              <h4>全国 6 大区域实时销售排名</h4>
              <span class="live-badge">
                <span class="live-dot"></span>
                {{ lastUpdate }}
              </span>
            </div>
            <div class="rank-list">
              <div
                v-for="(r, idx) in liveRanking"
                :key="r.name"
                class="rank-row"
                @click="openDrill(r)"
              >
                <span class="rank-idx" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
                <span class="rank-name">{{ r.name }}</span>
                <span class="rank-sales">{{ r.sales.toLocaleString() }}<span class="rank-unit">万</span></span>
                <span class="rank-change" :class="r.change >= 0 ? 'up' : 'down'">
                  {{ r.change >= 0 ? '↑' : '↓' }} {{ Math.abs(r.change) }}%
                </span>
                <el-tag v-if="regionAnomalyCount(r.name)" size="small" type="danger" effect="plain" class="rank-badge">
                  {{ regionAnomalyCount(r.name) }} 起
                </el-tag>
                <el-icon class="rank-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Tab Content -->
      <router-view v-else />
    </div>

    <TianqiFloat />

    <!-- 区域穿透弹窗：集团 → 区域 → 个人 -->
    <el-dialog v-model="drillVisible" :title="drillTitle" width="640px">
      <template v-if="drillRegion">
        <div class="drill-head">
          <div class="drill-left">
            <div class="drill-sales">{{ drillRegion.sales.toLocaleString() }}<span>万元</span></div>
            <div class="drill-meta">负责主管：<b>{{ regionManager[drillRegion.name] }}</b></div>
            <div class="drill-meta">环比 {{ drillRegion.change >= 0 ? '↑' : '↓' }} {{ Math.abs(drillRegion.change) }}%</div>
          </div>
          <div class="drill-summary">
            <div class="ds-item"><b>{{ drillSummary.total }}</b><span>异常总数</span></div>
            <div class="ds-item warn"><b>{{ drillSummary.pending }}</b><span>待处理</span></div>
            <div class="ds-item success"><b>{{ drillSummary.resolved }}</b><span>已处理</span></div>
          </div>
        </div>
        <div class="drill-list">
          <div v-if="drillAnomalies.length === 0" class="drill-empty">
            <el-icon :size="36"><CircleCheckFilled /></el-icon>
            <p>该区域暂无异常，态势平稳</p>
          </div>
          <div v-for="a in drillAnomalies" :key="a.id" class="drill-item">
            <div class="drill-item-top">
              <el-tag :type="severityMap[a.severity].color" size="small" effect="dark">
                {{ severityMap[a.severity].label }}
              </el-tag>
              <span class="drill-title">{{ a.title }}</span>
              <el-tag :type="statusMap[a.status].color" size="small" effect="plain">
                {{ statusMap[a.status].label }}
              </el-tag>
            </div>
            <div class="drill-item-meta">
              <span>{{ a.owner }}</span><span>·</span><span>{{ a.time }}</span><span>·</span><span>{{ a.product }}</span>
            </div>
            <div class="drill-item-ai">
              <el-icon :size="13"><MagicStick /></el-icon>
              {{ a.aiSuggestion }}
            </div>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import TianqiFloat from '../../components/TianqiFloat.vue'
import {
  Connection, SwitchButton, Money, WarningFilled, TrendCharts,
  DataBoard, ChatDotRound, DataAnalysis, Document, Promotion,
  Opportunity, Aim, ArrowRight, MagicStick, CircleCheckFilled
} from '@element-plus/icons-vue'
import {
  nationalSalesData, forecastData, kpiDailyWeeklyMonthly,
  healthScore, areaSalesRanking, executiveAnomalies, severityMap
} from '../../mock/data'
import { useTianqi } from '../../composables/useTianqi'

const router = useRouter()
const route = useRoute()
const { openTianqi } = useTianqi()

const trendChartRef = ref(null)
let trendChartInstance = null

const userStr = sessionStorage.getItem('currentUser')
const user = userStr ? JSON.parse(userStr) : {}

const anomalies = executiveAnomalies
const pendingCount = computed(() => anomalies.filter(a => a.status === 'pending').length)
const kpiMonthly = kpiDailyWeeklyMonthly[2]
const targetRate = kpiDailyWeeklyMonthly[3].value

const today = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
})

const tabs = [
  { key: 'tianqi', label: '首页', route: '/executive/tianqi', icon: Promotion },
  { key: 'info-summary', label: '信息汇总', route: '/executive/info-summary', icon: DataBoard },
  { key: 'profile', label: '我的', route: '/executive/profile', icon: TrendCharts },
]

const activeTab = computed(() => {
  const path = route.path
  if (path.includes('tianqi')) return 'tianqi'
  if (path.includes('info-summary')) return 'info-summary'
  if (path.includes('profile')) return 'profile'
  return 'tianqi'
})

const statusMap = {
  pending: { label: '待处理', color: 'danger' },
  processing: { label: '处理中', color: 'warning' },
  resolved: { label: '已处理', color: 'success' },
  cannot_resolve: { label: '无法处理', color: 'info' }
}

const regionManager = {
  '华东地区': '李红',
  '华南地区': '陈明',
  '华北地区': '王芳',
  '华中地区': '赵敏',
  '西南地区': '孙丽',
  '西北地区': '周强',
  '东北地区': '钱进',
  '东南地区': '郑琳',
  '中原地区': '何军',
  '云贵地区': '罗燕'
}

function trendClass(t) {
  if (t === '—' || t === '-') return 'neutral'
  return t.startsWith('-') ? 'down' : 'up'
}

function healthColor(v) {
  if (v >= 85) return '#10b981'
  if (v >= 75) return '#1a56db'
  return '#f59e0b'
}

// ---------- 区域实时排名（3s 轻微抖动模拟实时刷新） ----------
const baseRanking = areaSalesRanking
const liveRanking = ref(areaSalesRanking.map(r => ({ ...r })))
const lastUpdate = ref('实时刷新 · 每3秒')
let jitterTimer = null

function startRankingJitter() {
  jitterTimer = setInterval(() => {
    liveRanking.value = liveRanking.value.map(r => {
      const base = baseRanking.find(b => b.name === r.name)
      // 按比例轻微抖动（±1%），避免小基数区域被钳制导致排名失真
      const ratio = 1 + (Math.random() - 0.5) * 0.02
      const newSales = Math.round(base.sales * ratio)
      const newChange = Math.round((base.change + (Math.random() - 0.5) * 0.6) * 10) / 10
      return { ...r, sales: newSales, change: newChange }
    })
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    lastUpdate.value = `更新于 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }, 3000)
}

function regionAnomalyCount(name) {
  return executiveAnomalies.filter(a => a.region === name).length
}

// ---------- 区域穿透弹窗 ----------
const drillVisible = ref(false)
const drillRegion = ref(null)

const drillTitle = computed(() => drillRegion.value ? `区域下钻 · ${drillRegion.value.name}` : '区域下钻')
const drillAnomalies = computed(() => {
  return drillRegion.value ? executiveAnomalies.filter(a => a.region === drillRegion.value.name) : []
})
const drillSummary = computed(() => {
  const list = drillAnomalies.value
  return {
    total: list.length,
    pending: list.filter(a => a.status === 'pending').length,
    resolved: list.filter(a => a.status === 'resolved').length
  }
})

function openDrill(r) {
  drillRegion.value = r
  drillVisible.value = true
}

// ---------- 图表与导航 ----------
function switchTab(routePath) { router.push(routePath) }
function openAssistant() { openTianqi() }

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
  if (trendChartInstance) trendChartInstance.dispose()
  trendChartInstance = echarts.init(trendChartRef.value)
  trendChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 }
    },
    legend: {
      data: ['实际销售额', 'AI预测', '置信区间'],
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 12 },
      itemWidth: 16,
      itemHeight: 8
    },
    grid: { left: '3%', right: '3%', bottom: '3%', top: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: forecastData.months,
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
    series: [
      {
        name: '置信区间',
        type: 'line',
        stack: 'band',
        connectNulls: true,
        data: forecastData.lower,
        symbol: 'none',
        lineStyle: { opacity: 0 },
        tooltip: { show: false },
        emphasis: { disabled: true },
        z: 1
      },
      {
        name: '置信区间',
        type: 'line',
        stack: 'band',
        connectNulls: true,
        data: forecastData.upper.map((u, i) => u != null ? u - forecastData.lower[i] : null),
        symbol: 'none',
        lineStyle: { opacity: 0 },
        areaStyle: { color: 'rgba(139, 92, 246, 0.10)' },
        tooltip: { show: false },
        emphasis: { disabled: true },
        z: 1
      },
      {
        name: '实际销售额',
        type: 'line',
        connectNulls: false,
        data: forecastData.actual,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#1a56db', width: 3 },
        itemStyle: { color: '#1a56db' },
        z: 3
      },
      {
        name: 'AI预测',
        type: 'line',
        connectNulls: true,
        data: forecastData.forecast,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#8b5cf6', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#8b5cf6' },
        z: 2
      }
    ]
  })
}

onMounted(() => {
  setTimeout(initTrendChart, 100)
  startRankingJitter()
})

watch(activeTab, (val) => {
  if (val === 'tianqi') {
    setTimeout(initTrendChart, 200)
  }
})

onUnmounted(() => {
  if (jitterTimer) clearInterval(jitterTimer)
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

.nav-left { display: flex; align-items: center; }
.brand { display: flex; align-items: center; gap: 10px; color: #1a56db; font-weight: 700; font-size: 18px; letter-spacing: 1px; }
.nav-center { display: flex; align-items: center; }

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

.tab-item:hover { color: #1a56db; }
.tab-item.active {
  background: white;
  color: #1a56db;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(26, 86, 219, 0.12);
}

.nav-right { display: flex; align-items: center; gap: 12px; }
.user-info { display: flex; align-items: center; gap: 8px; }
.user-name { font-size: 14px; color: #1e293b; font-weight: 500; }

.main-area { flex: 1; overflow-y: auto; padding: 24px 32px; }

.welcome-banner {
  background: linear-gradient(135deg, #0f172a, #1a56db, #3b82f6);
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

.welcome-text h2 { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
.welcome-date { font-size: 13px; opacity: 0.8; }

.ai-tip {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.12);
  padding: 10px 16px;
  border-radius: 8px;
}

.ai-tag { flex-shrink: 0; }
.tip-text { font-size: 13px; opacity: 0.9; }

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
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

.stat-body { flex: 1; min-width: 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #1e293b; line-height: 1.2; }
.stat-unit { font-size: 14px; font-weight: 500; color: #64748b; margin-left: 4px; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }
.stat-trend { font-size: 12px; font-weight: 500; margin-top: 6px; }
.stat-trend.up { color: #10b981; }
.stat-trend.down { color: #ef4444; }
.stat-progress { margin-top: 8px; }

/* 日/周/月 KPI */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-period { font-size: 12px; font-weight: 600; color: #1a56db; }
.kpi-value { font-size: 22px; font-weight: 700; color: #1e293b; line-height: 1.3; }
.kpi-unit { font-size: 12px; font-weight: 500; color: #64748b; margin-left: 4px; }
.kpi-label { font-size: 12px; color: #64748b; }
.kpi-trend { font-size: 12px; font-weight: 500; }
.kpi-trend.up { color: #10b981; }
.kpi-trend.down { color: #ef4444; }
.kpi-trend.neutral { color: #94a3b8; }

.content-row { display: flex; gap: 24px; margin-bottom: 20px; }
.quick-actions-card, .trend-card, .health-card, .rank-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
}
.quick-actions-card { width: 340px; flex-shrink: 0; }
.trend-card { flex: 1; }
.quick-actions-card h4, .trend-card h4, .health-card h4, .rank-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-head h4 { margin-bottom: 0; }

.forecast-tag {
  font-size: 12px;
  color: #94a3b8;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #10b981;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.75); }
}

.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
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
.action-item:hover { background: #f8fafc; border-color: #e2e8f0; transform: translateY(-1px); }
.action-item span { font-size: 12px; color: #64748b; }

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-bg { background: #eff6ff; color: #1a56db; }
.chat-bg { background: #ecfdf5; color: #10b981; }
.chart-bg { background: #fff7ed; color: #f59e0b; }
.report-bg { background: #f5f3ff; color: #8b5cf6; }

.mini-chart { width: 100%; height: 260px; }

/* 健康度 + 排名 */
.bottom-row {
  display: flex;
  gap: 24px;
}

.health-card {
  width: 380px;
  flex-shrink: 0;
}

.health-body {
  display: flex;
  gap: 24px;
  align-items: center;
}

.health-ring { flex-shrink: 0; }
.health-score { font-size: 26px; font-weight: 700; color: #1a56db; }
.health-unit { font-size: 13px; font-weight: 500; color: #64748b; margin-left: 2px; }

.health-items { flex: 1; display: flex; flex-direction: column; gap: 14px; }

.health-item-top {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
  margin-bottom: 6px;
}

.health-item-top span:last-child { font-weight: 600; color: #1e293b; }

.rank-card { flex: 1; min-width: 0; }

.rank-list { display: flex; flex-direction: column; }

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.rank-row:hover { background: #eff6ff; }

.rank-idx {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-idx.top { background: #1a56db; color: white; }

.rank-name { width: 70px; font-size: 13px; font-weight: 500; color: #1e293b; flex-shrink: 0; }

.rank-sales { font-size: 14px; font-weight: 600; color: #1e293b; flex: 1; text-align: right; }
.rank-unit { font-size: 11px; font-weight: 400; color: #94a3b8; margin-left: 2px; }

.rank-change { font-size: 12px; font-weight: 500; width: 64px; text-align: right; flex-shrink: 0; }
.rank-change.up { color: #10b981; }
.rank-change.down { color: #ef4444; }

.rank-badge { flex-shrink: 0; }
.rank-arrow { color: #cbd5e1; font-size: 14px; flex-shrink: 0; }

/* 穿透弹窗 */
.drill-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eff6ff;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.drill-sales { font-size: 26px; font-weight: 700; color: #1a56db; }
.drill-sales span { font-size: 13px; font-weight: 500; color: #64748b; margin-left: 4px; }
.drill-meta { font-size: 13px; color: #475569; margin-top: 4px; }

.drill-summary {
  display: flex;
  gap: 20px;
}

.ds-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ds-item b { font-size: 22px; font-weight: 700; color: #1a56db; }
.ds-item.warn b { color: #f59e0b; }
.ds-item.success b { color: #10b981; }
.ds-item span { font-size: 12px; color: #64748b; }

.drill-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
}

.drill-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  transition: all 0.2s;
}

.drill-item:hover { border-color: #bfdbfe; }

.drill-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drill-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drill-item-meta {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

.drill-item-ai {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1a56db;
  background: #eff6ff;
  border-radius: 6px;
  padding: 6px 8px;
  margin-top: 8px;
}

.drill-empty {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
}

.drill-empty .el-icon { color: #bfdbfe; margin-bottom: 8px; }
.drill-empty p { font-size: 13px; }
</style>
