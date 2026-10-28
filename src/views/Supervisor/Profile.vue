<template>
  <div class="supervisor-profile">
    <UserProfile
      :accountFields="accountFields"
      :statCards="statCards"
      barChartTitle="华东区域近6个月总销售额"
      :barChartData="salesData"
      pieChartTitle="各区域销售额占比"
      :pieChartData="regionPieData"
    />

    <!-- 团队业绩排行榜 -->
    <div class="rank-card">
      <div class="rank-header">
        <el-icon :size="18"><Trophy /></el-icon>
        <span>团队业绩排行榜</span>
        <span class="rank-sub">本月 · 按销售额排序</span>
      </div>
      <div class="rank-list">
        <div v-for="p in teamRanking" :key="p.rank" class="rank-item" :class="{ top3: p.rank <= 3 }">
          <span class="rank-no" :class="{ gold: p.rank === 1, silver: p.rank === 2, bronze: p.rank === 3 }">{{ p.rank }}</span>
          <span class="rank-name">{{ p.name }}</span>
          <span class="rank-sales">{{ p.sales }}<span class="unit">万</span></span>
          <span class="rank-growth" :class="p.growth >= 0 ? 'up' : 'down'">{{ p.growth >= 0 ? '↑' : '↓' }} {{ Math.abs(p.growth) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import UserProfile from '../../components/UserProfile.vue'
import { supervisorSalesData, supervisorRankData, anomalyKPI, teamRanking } from '../../mock/data'
import { Warning, Timer, Finished, UploadFilled, Trophy } from '@element-plus/icons-vue'

const userStr = sessionStorage.getItem('currentUser')
const user = userStr ? JSON.parse(userStr) : {}

const accountFields = [
  { label: '姓名', value: user.name },
  { label: '工号', value: user.id },
  { label: '职位', value: user.position },
  { label: '管辖地区', value: user.region },
  { label: '管辖范围', value: user.scope }
]

const statCards = [
  { label: '累计处理异常', value: anomalyKPI.total, unit: '起', icon: Warning, color: '#ef4444', bg: '#fef2f2', sub: `按时办结率 ${anomalyKPI.onTimeRate}%` },
  { label: '平均处置时长', value: anomalyKPI.avgHours, unit: '小时', icon: Timer, color: '#f59e0b', bg: '#fff7ed', sub: '行业基准 6 小时' },
  { label: '异常按时率', value: anomalyKPI.onTimeRate, unit: '%', icon: Finished, color: '#10b981', bg: '#ecfdf5', progress: anomalyKPI.onTimeRate },
  { label: '已上报集团', value: anomalyKPI.escalated, unit: '起', icon: UploadFilled, color: '#1a56db', bg: '#eff6ff', sub: '等待集团批示' }
]

const salesData = {
  months: supervisorSalesData.months,
  amounts: supervisorSalesData.amounts
}

const chartColors = ['#1a56db', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']

const regionPieData = supervisorRankData.regions.map((region, index) => ({
  name: region,
  value: supervisorRankData.values[index],
  itemStyle: { color: chartColors[index] }
}))
</script>

<style scoped>
.supervisor-profile {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 团队业绩排行榜 */
.rank-card {
  background: white;
  border-radius: 12px;
  padding: 24px 28px;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
}

.rank-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1a56db;
}

.rank-header .el-icon { color: #f59e0b; }

.rank-sub {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 8px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.rank-item:hover { background: #f8fafc; }

.rank-item.top3 { background: #f8fafc; }

.rank-no {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-no.gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
.rank-no.silver { background: linear-gradient(135deg, #cbd5e1, #94a3b8); color: white; }
.rank-no.bronze { background: linear-gradient(135deg, #d97706, #b45309); color: white; }

.rank-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.rank-sales {
  font-size: 15px;
  font-weight: 600;
  color: #1a56db;
}

.rank-sales .unit {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 2px;
}

.rank-growth {
  font-size: 13px;
  font-weight: 500;
  width: 70px;
  text-align: right;
}

.rank-growth.up { color: #10b981; }
.rank-growth.down { color: #ef4444; }
</style>
