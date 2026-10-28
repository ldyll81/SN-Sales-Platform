<template>
  <UserProfile
    :accountFields="accountFields"
    :statCards="statCards"
    barChartTitle="集团全国近6个月总销售额"
    :barChartData="salesData"
    pieChartTitle="各公司销售额占比"
    :pieChartData="companyPieData"
  />
</template>

<script setup>
import UserProfile from '../../components/UserProfile.vue'
import { nationalSalesData, executiveRankData, healthScore, executiveAnomalies } from '../../mock/data'
import { Opportunity, Warning, Money } from '@element-plus/icons-vue'

const userStr = sessionStorage.getItem('currentUser')
const user = userStr ? JSON.parse(userStr) : {}

const accountFields = [
  { label: '姓名', value: user.name },
  { label: '工号', value: user.id },
  { label: '所属集团', value: user.company },
  { label: '职位', value: user.position },
  { label: '管辖范围', value: user.scope }
]

const escalatedCount = executiveAnomalies.filter(a => a.status === 'cannot_resolve').length

const statCards = [
  { label: '异常处理健康度', value: healthScore.score, unit: '分', icon: Opportunity, color: '#10b981', bg: '#ecfdf5', progress: healthScore.score, sub: healthScore.level },
  { label: '全国异常总数', value: executiveAnomalies.length, unit: '起', icon: Warning, color: '#f59e0b', bg: '#fff7ed', sub: `已上报集团 ${escalatedCount} 起` },
  { label: '月度总销售额', value: 14200, unit: '万元', icon: Money, color: '#1a56db', bg: '#eff6ff', sub: '环比 -6.6%' }
]

const salesData = {
  months: nationalSalesData.months,
  amounts: nationalSalesData.amounts
}

const chartColors = ['#1a56db', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']

const companyPieData = executiveRankData.map((item, index) => ({
  name: item.name,
  value: item.value,
  itemStyle: { color: chartColors[index] }
}))
</script>
