<template>
  <div class="info-process-page">
    <div class="process-sidebar">
      <el-menu
        :default-active="activeFilter"
        class="filter-menu"
        @select="handleFilterChange"
      >
        <el-menu-item index="pending">
          <el-icon><WarningFilled /></el-icon>
          <span>待处理</span>
          <el-tag size="small" type="danger" class="menu-count">{{ counts.pending }}</el-tag>
        </el-menu-item>
        <el-menu-item index="processing">
          <el-icon><Loading /></el-icon>
          <span>处理中</span>
          <el-tag size="small" type="warning" class="menu-count">{{ counts.processing }}</el-tag>
        </el-menu-item>
        <el-menu-item index="resolved">
          <el-icon><CircleCheckFilled /></el-icon>
          <span>已处理</span>
          <el-tag size="small" type="success" class="menu-count">{{ counts.resolved }}</el-tag>
        </el-menu-item>
        <el-menu-item index="cannot_resolve">
          <el-icon><CircleCloseFilled /></el-icon>
          <span>无法处理</span>
          <el-tag size="small" type="info" class="menu-count">{{ counts.cannotResolve }}</el-tag>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="process-main">
      <div class="filter-header">
        <h3>{{ filterTitle }}</h3>
        <span class="filter-desc">
          IM机器人自动巡检 → AI异常判定 → 实时推送 · 当前 <strong>{{ filteredList.length }}</strong> 条
        </span>
      </div>

      <div class="anomaly-list">
        <div v-for="item in filteredList" :key="item.id" class="anomaly-card">
          <div class="anomaly-top">
            <div class="title-wrap">
              <el-tag :type="severityMap[item.severity].color" size="small" effect="dark" class="severity-tag">
                {{ severityMap[item.severity].label }}
              </el-tag>
              <h4 class="anomaly-title">{{ item.title }}</h4>
            </div>
            <el-tag :type="anomalyTypeMap[item.type].color" size="small" effect="plain">
              {{ anomalyTypeMap[item.type].label }}
            </el-tag>
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

          <!-- AI 处置建议（可展开） -->
          <div class="ai-suggestion">
            <div class="ai-suggestion-head" @click="toggleExpand(item.id)">
              <el-icon :size="15"><MagicStick /></el-icon>
              <span>AI 处置建议</span>
              <el-icon class="expand-arrow" :class="{ rotated: expanded[item.id] }"><ArrowDown /></el-icon>
            </div>
            <div v-if="expanded[item.id]" class="ai-suggestion-body">
              <div class="sug-row"><span class="sug-label">根因分析</span>{{ item.reason }}</div>
              <div class="sug-row"><span class="sug-label">处置建议</span>{{ item.aiSuggestion }}</div>
              <div class="sug-row"><span class="sug-label">建议幅度</span>{{ item.scope }}</div>
              <div class="sug-row script-row"><span class="sug-label">话术模板</span>{{ item.script }}</div>
            </div>
          </div>

          <!-- 待处理：处置操作 -->
          <div v-if="item.status === 'pending'" class="anomaly-actions">
            <el-button type="primary" size="small" round @click="startProcess(item.id)">
              <el-icon><EditPen /></el-icon>开始处理
            </el-button>
            <el-button type="success" size="small" round plain @click="handleResolve(item.id)">
              <el-icon><CircleCheck /></el-icon>已处理
            </el-button>
            <el-button type="danger" size="small" round plain @click="handleCannotResolve(item.id)">
              <el-icon><CircleClose /></el-icon>无法处理
            </el-button>
          </div>
          <!-- 处理中：可修改方案 -->
          <div v-else-if="item.status === 'processing'" class="anomaly-actions">
            <el-button type="success" size="small" round @click="handleResolve(item.id)">
              <el-icon><CircleCheck /></el-icon>已处理
            </el-button>
            <el-button type="warning" size="small" round plain @click="openModify(item)">
              <el-icon><Edit /></el-icon>修改方案
            </el-button>
            <el-button type="danger" size="small" round plain @click="handleCannotResolve(item.id)">
              <el-icon><CircleClose /></el-icon>无法处理
            </el-button>
          </div>
          <!-- 已处理 / 无法处理 -->
          <div v-else class="status-note">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ item.status === 'resolved' ? '已处理并自动归档至知识库，形成决策记录' : '已一键上报集团决策层，等待批示' }}</span>
          </div>
        </div>

        <div v-if="filteredList.length === 0" class="empty-state">
          <el-icon :size="48"><CircleCheckFilled /></el-icon>
          <p>暂无{{ filterTitle }}异常信息</p>
        </div>
      </div>

      <div class="bottom-actions">
        <el-button type="primary" size="large" class="action-btn-primary" @click="summaryVisible = true">
          <el-icon><MagicStick /></el-icon>
          AI总结与提炼
        </el-button>
        <el-button size="large" class="action-btn">
          <el-icon><Upload /></el-icon>
          上传报告
        </el-button>
      </div>
    </div>

    <!-- AI 总结弹窗 -->
    <el-dialog v-model="summaryVisible" title="AI 总结与提炼" width="560px">
      <div class="summary-dialog">
        <div class="summary-block">
          <div class="summary-title">本周华东区域异常态势</div>
          <div class="summary-grid">
            <div class="sum-item"><span class="sum-num">{{ counts.total }}</span><span>异常总数</span></div>
            <div class="sum-item"><span class="sum-num danger">{{ counts.pending }}</span><span>待处理</span></div>
            <div class="sum-item"><span class="sum-num warn">{{ counts.processing }}</span><span>处理中</span></div>
            <div class="sum-item"><span class="sum-num success">{{ counts.resolved }}</span><span>已处理</span></div>
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
          <div class="summary-title">AI 趋势预判</div>
          <p class="predict-text">高优先级事项集中在价格与库存维度，建议 4 小时内完成响应；社区团购渠道下滑已进入处理中，预计本周内闭环。若处置及时，区域目标完成率有望回升至 95%。</p>
        </div>
      </div>
    </el-dialog>

    <!-- 修改方案弹窗 -->
    <el-dialog v-model="modifyVisible" title="修改 AI 处置方案" width="560px">
      <el-form label-position="top">
        <el-form-item label="处置建议">
          <el-input v-model="modifyForm.aiSuggestion" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="建议幅度">
          <el-input v-model="modifyForm.scope" />
        </el-form-item>
        <el-form-item label="话术模板">
          <el-input v-model="modifyForm.script" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modifyVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmModify">确认修改并执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  WarningFilled, Loading, CircleCheckFilled, CircleCloseFilled,
  Location, OfficeBuilding, Goods, Clock,
  CircleCheck, CircleClose, MagicStick, Upload,
  EditPen, Edit, ArrowDown, InfoFilled
} from '@element-plus/icons-vue'
import { supervisorAnomalies, anomalyTypeMap, severityMap } from '../../mock/data'

const anomalies = ref(JSON.parse(JSON.stringify(supervisorAnomalies)))
const activeFilter = ref('pending')
const expanded = reactive({})
const summaryVisible = ref(false)
const modifyVisible = ref(false)
const modifyTarget = ref(null)
const modifyForm = reactive({ aiSuggestion: '', scope: '', script: '' })

const counts = computed(() => ({
  total: anomalies.value.length,
  pending: anomalies.value.filter(a => a.status === 'pending').length,
  processing: anomalies.value.filter(a => a.status === 'processing').length,
  resolved: anomalies.value.filter(a => a.status === 'resolved').length,
  cannotResolve: anomalies.value.filter(a => a.status === 'cannot_resolve').length
}))

const filterTitle = computed(() => {
  const map = { pending: '待处理异常', processing: '处理中异常', resolved: '已处理异常', cannot_resolve: '无法处理异常' }
  return map[activeFilter.value]
})

const filteredList = computed(() => {
  return anomalies.value.filter(a => a.status === activeFilter.value)
})

// 高频异常类型（按全部异常统计）
const topTypes = computed(() => {
  const grouped = {}
  anomalies.value.forEach(a => {
    grouped[a.type] = (grouped[a.type] || 0) + 1
  })
  const total = anomalies.value.length || 1
  return Object.entries(grouped)
    .map(([type, count]) => ({ type, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

function handleFilterChange(index) {
  activeFilter.value = index
}

function toggleExpand(id) {
  expanded[id] = !expanded[id]
}

function pushTimeline(item, text) {
  if (!item.timeline) item.timeline = []
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  item.timeline.push({
    time: `07-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    text
  })
}

async function writeBack(item, fields) {
  if (!item._recordId) return
  try {
    await fetch('/api/anomaly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: item._recordId, ...fields })
    })
  } catch (e) { /* 静默失败，下次同步会覆盖 */ }
}

function startProcess(id) {
  const item = anomalies.value.find(a => a.id === id)
  if (item) {
    item.status = 'processing'
    pushTimeline(item, '主管已开始处理，正在制定方案')
    writeBack(item, { status: 'processing' })
    ElMessage.success('已开始处理')
  }
}

function handleResolve(id) {
  const item = anomalies.value.find(a => a.id === id)
  if (item) {
    item.status = 'resolved'
    pushTimeline(item, '主管确认处理完毕，处置记录自动归档')
    writeBack(item, { status: 'resolved' })
    ElMessage.success('已标记为已处理，处置记录已归档')
  }
}

function handleCannotResolve(id) {
  const item = anomalies.value.find(a => a.id === id)
  if (item) {
    item.status = 'cannot_resolve'
    pushTimeline(item, '主管判定无法处理，一键上报集团决策层')
    writeBack(item, { status: 'cannot_resolve' })
    ElMessage.warning('已上报集团，等待批示')
  }
}

function openModify(item) {
  modifyTarget.value = item
  modifyForm.aiSuggestion = item.aiSuggestion
  modifyForm.scope = item.scope
  modifyForm.script = item.script
  modifyVisible.value = true
}

function confirmModify() {
  if (!modifyTarget.value) return
  modifyTarget.value.aiSuggestion = modifyForm.aiSuggestion
  modifyTarget.value.scope = modifyForm.scope
  modifyTarget.value.script = modifyForm.script
  modifyTarget.value.status = 'resolved'
  pushTimeline(modifyTarget.value, '主管手动调整AI方案后执行并归档')
  writeBack(modifyTarget.value, {
    status: 'resolved',
    aiSuggestion: modifyForm.aiSuggestion,
    scope: modifyForm.scope,
    script: modifyForm.script
  })
  modifyVisible.value = false
  ElMessage.success('方案已更新并执行归档')
}
</script>

<style scoped>
.info-process-page {
  display: flex;
  gap: 24px;
  height: 100%;
  min-height: 500px;
}

.process-sidebar {
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

.process-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filter-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.filter-desc {
  font-size: 13px;
  color: #64748b;
}

.filter-desc strong {
  color: #1a56db;
}

.anomaly-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.anomaly-card {
  background: white;
  border-radius: 10px;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(26, 86, 219, 0.04);
  transition: all 0.2s;
}

.anomaly-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.08);
}

.anomaly-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.severity-tag {
  flex-shrink: 0;
}

.anomaly-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anomaly-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
}

.tag-item .el-icon {
  font-size: 14px;
  color: #94a3b8;
}

.time-tag {
  color: #94a3b8;
}

/* AI 处置建议 */
.ai-suggestion {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.ai-suggestion-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #1a56db;
  cursor: pointer;
  user-select: none;
}

.expand-arrow {
  margin-left: auto;
  font-size: 13px;
  transition: transform 0.2s;
}

.expand-arrow.rotated {
  transform: rotate(180deg);
}

.ai-suggestion-body {
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sug-row {
  font-size: 13px;
  color: #334155;
  line-height: 1.7;
}

.sug-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: white;
  border-radius: 4px;
  padding: 1px 8px;
  margin-right: 8px;
}

.script-row {
  background: white;
  border-radius: 6px;
  padding: 8px 10px;
}

/* 操作区 */
.anomaly-actions {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.status-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #16a34a;
}

.status-note .el-icon {
  font-size: 14px;
}

.empty-state {
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

.bottom-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  margin-top: 16px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.action-btn-primary {
  flex: 1;
  height: 48px;
  font-size: 15px;
  border-radius: 10px;
}

.action-btn {
  flex: 1;
  height: 48px;
  font-size: 15px;
  border-radius: 10px;
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

.sum-num {
  font-size: 24px;
  font-weight: 700;
  color: #1a56db;
}

.sum-num.danger { color: #ef4444; }
.sum-num.warn { color: #f59e0b; }
.sum-num.success { color: #10b981; }

.sum-item span:last-child {
  font-size: 12px;
  color: #64748b;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.rank-label {
  width: 70px;
  font-size: 13px;
  color: #475569;
  flex-shrink: 0;
}

.rank-bar {
  flex: 1;
}

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
