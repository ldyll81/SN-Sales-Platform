<template>
  <div class="info-summary-page">
    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">地区</span>
        <el-select v-model="filterRegion" placeholder="全部地区" class="filter-select">
          <el-option label="全部地区" value="" />
          <el-option label="华东地区" value="华东" />
          <el-option label="华南地区" value="华南" />
          <el-option label="华北地区" value="华北" />
          <el-option label="华中地区" value="华中" />
          <el-option label="西南地区" value="西南" />
          <el-option label="西北地区" value="西北" />
          <el-option label="东北地区" value="东北" />
          <el-option label="东南地区" value="东南" />
          <el-option label="中原地区" value="中原" />
          <el-option label="云贵地区" value="云贵" />
        </el-select>
      </div>
      <div class="filter-group">
        <span class="filter-label">公司</span>
        <el-select v-model="filterCompany" placeholder="全部公司" class="filter-select">
          <el-option label="全部公司" value="" />
          <el-option label="圣农集团-华东区域" value="华东区域" />
          <el-option label="圣农集团-广东经营单元" value="广东" />
          <el-option label="圣农集团-北京经营单元" value="北京" />
          <el-option label="圣农集团-四川经营单元" value="四川" />
          <el-option label="圣农集团-陕西经营单元" value="陕西" />
          <el-option label="圣农集团-辽宁经营单元" value="辽宁" />
          <el-option label="圣农集团-浙江经营单元" value="浙江" />
          <el-option label="圣农集团-河南经营单元" value="河南" />
        </el-select>
      </div>
      <div class="filter-group">
        <span class="filter-label">产品种类</span>
        <el-select v-model="filterProduct" placeholder="全部种类" class="filter-select">
          <el-option label="全部种类" value="" />
          <el-option label="鸡胸肉调理品" value="鸡胸肉" />
          <el-option label="脆皮炸鸡翅" value="炸鸡翅" />
          <el-option label="鸡肉肠/鸡肉丸" value="鸡肉肠" />
          <el-option label="鸡腿肉" value="鸡腿肉" />
          <el-option label="鸡翅中礼盒" value="鸡翅中" />
          <el-option label="盐酥鸡/鸡米花" value="盐酥鸡" />
          <el-option label="散装鸡腿" value="散装鸡腿" />
        </el-select>
      </div>
      <el-button type="primary" class="search-btn" @click="handleSearch">
        <el-icon><Search /></el-icon>
        筛选
      </el-button>
    </div>

    <!-- Content -->
    <div class="summary-body">
      <div class="summary-sidebar">
        <el-menu
          :default-active="activeFilter"
          class="filter-menu"
          @select="handleFilterChange"
        >
          <el-menu-item index="processed">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>已处理</span>
            <el-tag size="small" type="success" class="menu-count">{{ processedCount }}</el-tag>
          </el-menu-item>
          <el-menu-item index="unprocessed">
            <el-icon><WarningFilled /></el-icon>
            <span>未处理</span>
            <el-tag size="small" type="danger" class="menu-count">{{ unprocessedCount }}</el-tag>
          </el-menu-item>
          <el-menu-item index="cannot_resolve">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>无法处理</span>
            <el-tag size="small" type="warning" class="menu-count">{{ cannotResolveCount }}</el-tag>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="summary-main">
        <div class="summary-header">
          <h3>
            <template v-if="activeFilter === 'processed'">已处理信息</template>
            <template v-else-if="activeFilter === 'unprocessed'">未处理信息</template>
            <template v-else>需高层处理事项</template>
          </h3>
          <span class="summary-count">共 <strong>{{ filteredAnomalies.length }}</strong> 条</span>
          <span v-if="activeFilter === 'processed'" class="header-hint">以下异常已由相关人员处理完毕，供您查阅</span>
          <span v-else-if="activeFilter === 'unprocessed'" class="header-hint">以下异常正在处理流程中，请持续关注</span>
          <span v-else class="header-hint hint-warning">以下异常需由您亲自批示处理意见</span>
        </div>

        <div class="anomaly-list" :class="{ 'single-col': activeFilter === 'cannot_resolve' }">
          <div v-for="item in filteredAnomalies" :key="item.id" class="anomaly-card" :class="{ 'needs-action': activeFilter === 'cannot_resolve' }">
            <div class="anomaly-top">
              <div class="title-wrap">
                <el-tag :type="severityMap[item.severity].color" size="small" effect="dark" class="severity-tag">
                  {{ severityMap[item.severity].label }}
                </el-tag>
                <h4 class="anomaly-title">{{ item.title }}</h4>
              </div>
              <div class="top-right">
                <el-tag :type="anomalyTypeMap[item.type].color" size="small" effect="plain">
                  {{ anomalyTypeMap[item.type].label }}
                </el-tag>
                <el-tag :type="statusTag(item).color" size="small" effect="plain">
                  {{ statusTag(item).label }}
                </el-tag>
              </div>
            </div>
            <div class="anomaly-tags">
              <span class="tag-item">
                <el-icon><Location /></el-icon>
                {{ item.region }}
              </span>
              <span class="tag-item">
                <el-icon><OfficeBuilding /></el-icon>
                {{ item.company }}
              </span>
              <span class="tag-item">
                <el-icon><Goods /></el-icon>
                {{ item.product }}
              </span>
              <span class="tag-item time-tag">
                <el-icon><Clock /></el-icon>
                {{ item.time }}
              </span>
            </div>

            <!-- 负责主管 -->
            <div class="owner-row">
              <el-icon :size="14"><User /></el-icon>
              <span>负责主管：{{ item.owner }}</span>
            </div>

            <!-- AI 处置建议（可展开） -->
            <div class="ai-suggestion">
              <div class="ai-suggestion-head" @click="toggleExpand(item.id)">
                <el-icon :size="14"><MagicStick /></el-icon>
                <span>AI 处置建议</span>
                <el-icon class="expand-arrow" :class="{ rotated: expanded[item.id] }"><ArrowDown /></el-icon>
              </div>
              <div v-if="expanded[item.id]" class="ai-suggestion-body">
                <div class="sug-row"><span class="sug-label">根因</span>{{ item.reason }}</div>
                <div class="sug-row"><span class="sug-label">方案</span>{{ item.aiSuggestion }}</div>
                <div class="sug-row"><span class="sug-label">幅度</span>{{ item.scope }}</div>
              </div>
            </div>

            <!-- 处置时间线 -->
            <div v-if="item.timeline && item.timeline.length" class="timeline">
              <div v-for="(t, i) in item.timeline" :key="i" class="timeline-item">
                <span class="timeline-dot" :class="{ last: i === item.timeline.length - 1 }"></span>
                <span class="timeline-text">{{ t.text }}</span>
                <span class="timeline-time">{{ t.time }}</span>
              </div>
            </div>

            <!-- 已处理/未处理：仅展示，无操作按钮 -->
            <div v-if="activeFilter === 'processed'" class="info-note">
              <el-icon><InfoFilled /></el-icon>
              <span>该异常已由区域主管处理完毕</span>
            </div>
            <div v-else-if="activeFilter === 'unprocessed'" class="info-note" :class="item.status === 'processing' ? 'note-processing' : 'note-pending'">
              <el-icon><Clock /></el-icon>
              <span>{{ item.status === 'processing' ? '区域主管处理中，处置记录已生成' : '等待区域主管处理中' }}</span>
            </div>

            <!-- 无法处理：文本框 + 提交按钮 -->
            <div v-else class="resolve-area">
              <el-input
                v-model="resolveNotes[item.id]"
                type="textarea"
                :rows="3"
                placeholder="请输入您的处理意见..."
                class="resolve-input"
              />
              <div class="resolve-actions">
                <el-button type="primary" @click="submitResolve(item.id)">
                  <el-icon><CircleCheck /></el-icon>
                  提交处理意见
                </el-button>
                <el-button @click="requestMoreInfo(item.id)">
                  <el-icon><ChatDotSquare /></el-icon>
                  要求补充资料
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="filteredAnomalies.length === 0" class="empty-state">
            <el-icon :size="48"><CircleCheckFilled /></el-icon>
            <p>暂无{{
              activeFilter === 'processed' ? '已处理' :
              activeFilter === 'unprocessed' ? '未处理' : '待处理'
            }}异常信息</p>
          </div>
        </div>

        <div class="bottom-action-bar">
          <el-button type="primary" size="large" class="ai-summary-btn" @click="summaryVisible = true">
            <el-icon><MagicStick /></el-icon>
            AI总结与提炼
          </el-button>
        </div>
      </div>
    </div>

    <!-- AI 总结与提炼弹窗 -->
    <el-dialog v-model="summaryVisible" title="AI 总结与提炼" width="580px">
      <div class="summary-dialog">
        <div class="summary-block">
          <div class="summary-title">本周全国异常总览</div>
          <div class="summary-grid">
            <div class="sum-item"><span class="sum-num">{{ summaryCounts.total }}</span><span>发现异常</span></div>
            <div class="sum-item success"><span class="sum-num">{{ summaryCounts.resolved }}</span><span>已处理</span></div>
            <div class="sum-item warn"><span class="sum-num">{{ summaryCounts.unresolved }}</span><span>在途</span></div>
            <div class="sum-item danger"><span class="sum-num">{{ summaryCounts.escalated }}</span><span>已上报集团</span></div>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-title">高频异常类型排名</div>
          <div v-for="t in topTypes" :key="t.type" class="rank-row">
            <span class="rank-label">{{ anomalyTypeMap[t.type].label }}</span>
            <el-progress :percentage="t.percent" :stroke-width="8" :show-text="false" class="rank-bar" />
            <span class="rank-num">{{ t.count }} 起</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-title">高频异常区域排名</div>
          <div v-for="r in topRegions" :key="r.region" class="rank-row">
            <span class="rank-label">{{ r.region }}</span>
            <el-progress :percentage="r.percent" :stroke-width="8" :show-text="false" class="rank-bar" />
            <span class="rank-num">{{ r.count }} 起</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-title">AI 趋势预判</div>
          <p class="predict-text">{{ summaryPredict }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  WarningFilled, CircleCheckFilled, CircleCloseFilled,
  Location, OfficeBuilding, Goods, Clock,
  CircleCheck, ChatDotSquare, MagicStick, Search, InfoFilled,
  User, ArrowDown
} from '@element-plus/icons-vue'
import { executiveAnomalies, severityMap, anomalyTypeMap } from '../../mock/data'

const anomalies = ref(JSON.parse(JSON.stringify(executiveAnomalies)))
const activeFilter = ref('unprocessed')
const resolveNotes = reactive({})
const expanded = reactive({})
const summaryVisible = ref(false)

const filterRegion = ref('')
const filterCompany = ref('')
const filterProduct = ref('')

const processedCount = computed(() => anomalies.value.filter(a => a.status === 'resolved').length)
const unprocessedCount = computed(() => anomalies.value.filter(a => a.status === 'pending' || a.status === 'processing').length)
const cannotResolveCount = computed(() => anomalies.value.filter(a => a.status === 'cannot_resolve').length)

const filteredAnomalies = computed(() => {
  const statusMap = {
    processed: 'resolved',
    unprocessed: ['pending', 'processing'],
    cannot_resolve: 'cannot_resolve'
  }
  const filter = statusMap[activeFilter.value]
  let list = Array.isArray(filter)
    ? anomalies.value.filter(a => filter.includes(a.status))
    : anomalies.value.filter(a => a.status === filter)
  if (filterRegion.value) {
    list = list.filter(a => a.region.includes(filterRegion.value))
  }
  if (filterCompany.value) {
    list = list.filter(a => a.company.includes(filterCompany.value))
  }
  if (filterProduct.value) {
    list = list.filter(a => a.product.includes(filterProduct.value))
  }
  return list
})

function handleFilterChange(index) {
  activeFilter.value = index
}

function handleSearch() {
  ElMessage.success('筛选条件已应用')
}

async function writeBack(item, fields) {
  if (!item._recordId) return
  try {
    await fetch('/api/anomaly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: item._recordId, ...fields })
    })
  } catch (e) { /* 静默失败 */ }
}

function submitResolve(id) {
  const note = resolveNotes[id]
  if (!note || !note.trim()) {
    ElMessage.warning('请先输入处理意见')
    return
  }
  const item = anomalies.value.find(a => a.id === id)
  if (item) {
    item.status = 'resolved'
    item.resolveNote = note
    writeBack(item, { status: 'resolved' })
    ElMessage.success('处理意见已提交，该事项已转为已处理')
    resolveNotes[id] = ''
  }
}

function requestMoreInfo(id) {
  ElMessage.info('已通知相关部门补充资料')
}

function toggleExpand(id) {
  expanded[id] = !expanded[id]
}

function statusTag(item) {
  if (item.status === 'resolved') return { label: '已处理', color: 'success' }
  if (item.status === 'processing') return { label: '处理中', color: 'warning' }
  if (item.status === 'cannot_resolve') return { label: '无法处理', color: 'info' }
  return { label: '待处理', color: 'danger' }
}

// ---------- AI 总结与提炼 ----------
const summaryCounts = computed(() => {
  const list = anomalies.value
  return {
    total: list.length,
    resolved: list.filter(a => a.status === 'resolved').length,
    unresolved: list.filter(a => a.status === 'pending' || a.status === 'processing').length,
    escalated: list.filter(a => a.status === 'cannot_resolve').length
  }
})

const topTypes = computed(() => {
  const grouped = {}
  anomalies.value.forEach(a => { grouped[a.type] = (grouped[a.type] || 0) + 1 })
  const total = anomalies.value.length || 1
  return Object.entries(grouped)
    .map(([type, count]) => ({ type, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

const topRegions = computed(() => {
  const grouped = {}
  anomalies.value.forEach(a => { grouped[a.region] = (grouped[a.region] || 0) + 1 })
  const total = anomalies.value.length || 1
  return Object.entries(grouped)
    .map(([region, count]) => ({ region, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

const summaryPredict = computed(() => {
  const c = summaryCounts.value
  const closedRate = c.total ? Math.round((c.resolved / c.total) * 100) : 0
  return `本周集团共监控到异常 ${c.total} 起，已处理 ${c.resolved} 起（闭环率 ${closedRate}%）。当前仍有 ${c.unresolved} 起在途：待主管响应或处理中，${c.escalated} 起已上报集团等待批示。建议优先处置高严重度价格与竞品事项，若 4 小时内完成响应，Q4 整体闭环率有望提升至 92% 以上。`
})
</script>

<style scoped>
.info-summary-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.04);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  font-weight: 500;
}

.filter-select {
  width: 150px;
}

.search-btn {
  margin-left: auto;
  border-radius: 8px;
}

.summary-body {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.summary-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.filter-menu {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
}

.filter-menu :deep(.el-menu-item) {
  height: 54px;
  line-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-menu :deep(.el-menu-item.is-active) {
  color: #1a56db;
  background: #eff6ff;
  border-left: 3px solid #1a56db;
}

.menu-count {
  margin-left: auto;
}

.summary-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.summary-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.summary-count {
  font-size: 13px;
  color: #64748b;
}

.summary-count strong {
  color: #1a56db;
}

.header-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
  padding: 4px 12px;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.hint-warning {
  color: #f59e0b;
  background: #fff7ed;
  border-color: #fed7aa;
}

.anomaly-list {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
  align-content: start;
}

.anomaly-list.single-col {
  grid-template-columns: 1fr;
}

.anomaly-card {
  background: white;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(26, 86, 219, 0.04);
  transition: all 0.2s;
}

.anomaly-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.08);
}

.anomaly-card.needs-action {
  border-left: 4px solid #f59e0b;
}

.anomaly-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.anomaly-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anomaly-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #64748b;
}

.tag-item .el-icon {
  font-size: 13px;
  color: #94a3b8;
}

.time-tag {
  color: #94a3b8;
}

.info-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  font-size: 12px;
  color: #16a34a;
  margin-top: 4px;
}

.note-pending {
  background: #fff7ed;
  color: #d97706;
}

.resolve-area {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.resolve-input {
  margin-bottom: 10px;
}

.resolve-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  color: #94a3b8;
}

.empty-state .el-icon {
  color: #bfdbfe;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
}

.bottom-action-bar {
  padding-top: 16px;
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ai-summary-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  border-radius: 10px;
}

/* 卡片增强 */
.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.severity-tag { flex-shrink: 0; }

.top-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.owner-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #475569;
  margin-bottom: 8px;
}

.owner-row .el-icon { color: #94a3b8; }

/* AI 处置建议 */
.ai-suggestion {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.ai-suggestion-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #1a56db;
  cursor: pointer;
  user-select: none;
}

.expand-arrow {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.2s;
}

.expand-arrow.rotated { transform: rotate(180deg); }

.ai-suggestion-body {
  padding: 2px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sug-row { font-size: 12px; color: #334155; line-height: 1.7; }

.sug-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: white;
  border-radius: 4px;
  padding: 1px 7px;
  margin-right: 7px;
}

/* 处置时间线 */
.timeline {
  padding: 6px 0 4px 4px;
  margin-bottom: 8px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  color: #64748b;
}

.timeline-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #93c5fd;
  flex-shrink: 0;
}

.timeline-dot.last {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.timeline-text { flex: 1; }

.timeline-time {
  color: #94a3b8;
  font-size: 11px;
  flex-shrink: 0;
}

.note-processing {
  background: #eff6ff;
  color: #1a56db;
}

/* AI 总结弹窗 */
.summary-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a56db;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #1a56db;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.sum-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sum-num { font-size: 24px; font-weight: 700; color: #1a56db; }
.sum-item.success .sum-num { color: #10b981; }
.sum-item.warn .sum-num { color: #f59e0b; }
.sum-item.danger .sum-num { color: #ef4444; }

.sum-item span:last-child { font-size: 12px; color: #64748b; }

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.rank-label {
  width: 90px;
  font-size: 13px;
  color: #475569;
  flex-shrink: 0;
}

.rank-bar { flex: 1; }

.rank-num {
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
  width: 48px;
  text-align: right;
}

.predict-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.8;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 14px;
}
</style>
