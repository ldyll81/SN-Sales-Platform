<template>
  <UserProfile
    :accountFields="accountFields"
    :statCards="statCards"
    barChartTitle="近6个月个人销售额"
    :barChartData="salesData"
    pieChartTitle="在华东地区销售排名"
    :pieChartData="pieData"
  />
</template>

<script setup>
import UserProfile from '../../components/UserProfile.vue'
import { employeeSalesData, employeeRankData, targetProgress } from '../../mock/data'
import { Aim, Trophy, Money } from '@element-plus/icons-vue'

const userStr = sessionStorage.getItem('currentUser')
const user = userStr ? JSON.parse(userStr) : {}

const accountFields = [
  { label: '姓名', value: user.name },
  { label: '工号', value: user.id },
  { label: '身份', value: user.position },
  { label: '所属地区', value: user.region },
  { label: '所属部门', value: user.department }
]

const statCards = [
  { label: '本月目标完成率', value: targetProgress.rate, unit: '%', icon: Aim, color: '#10b981', bg: '#ecfdf5', progress: targetProgress.rate },
  { label: '本月销售额', value: targetProgress.completed, unit: '万元', icon: Money, color: '#1a56db', bg: '#eff6ff', sub: `目标 ${targetProgress.monthlyTarget} 万` },
  { label: '区域销售排名', value: `第${employeeRankData.rank}名`, unit: `/ ${employeeRankData.totalEmployees}人`, icon: Trophy, color: '#f59e0b', bg: '#fff7ed', sub: `超过 ${employeeRankData.percentile}% 同事` }
]

const salesData = {
  months: employeeSalesData.months,
  amounts: employeeSalesData.amounts
}

const pieData = [
  { name: `超过的同事 (${employeeRankData.percentile}%)`, value: employeeRankData.percentile, itemStyle: { color: '#1a56db' } },
  { name: '剩余', value: 100 - employeeRankData.percentile, itemStyle: { color: '#e2e8f0' } }
]
</script>
