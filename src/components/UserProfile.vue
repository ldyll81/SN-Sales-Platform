<template>
  <div class="profile-page">
    <div class="profile-sidebar">
      <el-menu
        :default-active="activeSection"
        class="profile-menu"
        @select="handleSelect"
      >
        <el-menu-item index="account">
          <el-icon><User /></el-icon>
          <span>账户信息</span>
        </el-menu-item>
        <el-menu-item index="business">
          <el-icon><TrendCharts /></el-icon>
          <span>经营情况</span>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="profile-content">
      <!-- KPI 统计行（可选） -->
      <div v-if="statCards.length" class="stat-row">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="stat-card"
          :style="{ borderLeft: `4px solid ${card.color || '#1a56db'}` }"
        >
          <div class="stat-icon" :style="{ background: (card.bg || '#eff6ff'), color: (card.color || '#1a56db') }">
            <el-icon :size="22"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ card.value }}<span class="stat-unit">{{ card.unit }}</span></div>
            <div class="stat-label">{{ card.label }}</div>
            <div v-if="card.progress" class="stat-progress">
              <el-progress :percentage="card.progress" :show-text="false" :stroke-width="6" />
            </div>
            <div v-else-if="card.sub" class="stat-sub">{{ card.sub }}</div>
          </div>
        </div>
      </div>

      <!-- 账户信息 -->
      <div v-if="activeSection === 'account'" class="section-card">
        <div class="section-header">
          <el-icon :size="20"><User /></el-icon>
          <span>账户信息</span>
        </div>
        <el-descriptions :column="2" border class="info-table">
          <el-descriptions-item
            v-for="item in accountFields"
            :key="item.label"
            :label="item.label"
            :label-class-name="'desc-label'"
            :content-class-name="'desc-value'"
          >
            {{ item.value || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 经营情况 -->
      <div v-if="activeSection === 'business'" class="section-card">
        <div class="section-header">
          <el-icon :size="20"><TrendCharts /></el-icon>
          <span>经营情况</span>
        </div>
        <div class="charts-row">
          <div class="chart-wrapper">
            <h4 class="chart-title">{{ barChartTitle }}</h4>
            <div ref="barChartRef" class="chart-container"></div>
          </div>
          <div class="chart-wrapper">
            <h4 class="chart-title">{{ pieChartTitle }}</h4>
            <div ref="pieChartRef" class="chart-container"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { User, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const props = defineProps({
  accountFields: { type: Array, default: () => [] },
  barChartTitle: { type: String, default: '近6个月销售额' },
  barChartData: { type: Object, default: () => ({ months: [], amounts: [] }) },
  pieChartTitle: { type: String, default: '销售额分布' },
  pieChartData: { type: Array, default: () => [] },
  statCards: { type: Array, default: () => [] }
})

const activeSection = ref('account')
const barChartRef = ref(null)
const pieChartRef = ref(null)
let barChartInstance = null
let pieChartInstance = null

function handleSelect(index) {
  activeSection.value = index
  if (index === 'business') {
    // 等待 DOM 渲染后再初始化图表
    nextTick(() => {
      tryInitCharts(0)
    })
  }
}

function tryInitCharts(retryCount) {
  if (retryCount > 5) {
    console.warn('图表DOM未就绪，已重试5次')
    return
  }
  if (!barChartRef.value || !pieChartRef.value) {
    setTimeout(() => tryInitCharts(retryCount + 1), 150)
    return
  }
  initCharts()
}

function initCharts() {
  // 柱状图
  if (barChartRef.value && props.barChartData.months.length) {
    if (barChartInstance) barChartInstance.dispose()
    barChartInstance = echarts.init(barChartRef.value)
    barChartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 13 },
        formatter: '{b}<br/>销售额：<strong>{c}万元</strong>'
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: props.barChartData.months,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        name: '销售额（万元）',
        nameTextStyle: { color: '#94a3b8', fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: props.barChartData.amounts,
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#1a56db' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: {
          itemStyle: { color: '#1e40af' }
        }
      }]
    })

    // 窗口大小变化自适应
    barChartInstance.resize()
  }

  // 饼图
  if (pieChartRef.value && props.pieChartData.length > 0) {
    if (pieChartInstance) pieChartInstance.dispose()
    pieChartInstance = echarts.init(pieChartRef.value)
    const isSimpleRank = props.pieChartData.length === 2 && props.pieChartData.some(d => d.name.includes('超过'))
    pieChartInstance.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 13 },
        formatter: isSimpleRank
          ? '{b}: {c}%'
          : '{b}<br/>销售额：{c}万元 ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: isSimpleRank ? ['55%', '75%'] : ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        padAngle: isSimpleRank ? 0 : 1,
        itemStyle: {
          borderRadius: isSimpleRank ? 0 : 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: isSimpleRank ? '' : '{b}\n{d}%',
          color: '#475569',
          fontSize: 12,
          lineHeight: 18
        },
        labelLine: {
          show: !isSimpleRank,
          length: 10,
          length2: 15
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)'
          },
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: props.pieChartData
      }]
    })

    pieChartInstance.resize()
  }
}

// 数据变化重新渲染
watch(() => props.barChartData, () => {
  if (activeSection.value === 'business') {
    nextTick(() => tryInitCharts(0))
  }
}, { deep: true })

watch(() => props.pieChartData, () => {
  if (activeSection.value === 'business') {
    nextTick(() => tryInitCharts(0))
  }
}, { deep: true })

onMounted(() => {
  if (activeSection.value === 'business') {
    nextTick(() => tryInitCharts(0))
  }
})

onUnmounted(() => {
  barChartInstance?.dispose()
  pieChartInstance?.dispose()
})
</script>

<style scoped>
.profile-page {
  display: flex;
  gap: 24px;
  height: 100%;
  min-height: 500px;
}

.profile-sidebar {
  width: 180px;
  flex-shrink: 0;
}

.profile-menu {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
}

.profile-menu :deep(.el-menu-item) {
  height: 52px;
  line-height: 52px;
  font-size: 14px;
  border-left: 3px solid transparent;
}

.profile-menu :deep(.el-menu-item.is-active) {
  border-left-color: #1a56db;
  color: #1a56db;
  background: #eff6ff;
}

.profile-content {
  flex: 1;
  min-width: 0;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  gap: 14px;
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
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-unit {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.stat-progress {
  margin-top: 8px;
}

.stat-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 2px solid #1a56db;
}

.info-table :deep(.el-descriptions__label) {
  width: 120px;
  color: #64748b;
  background: #f8fafc;
}

.info-table :deep(.el-descriptions__content) {
  color: #1e293b;
  font-weight: 500;
}

.charts-row {
  display: flex;
  gap: 24px;
}

.chart-wrapper {
  flex: 1;
  min-width: 0;
}

.chart-title {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #1a56db;
}

.chart-container {
  width: 100%;
  height: 340px;
}
</style>
