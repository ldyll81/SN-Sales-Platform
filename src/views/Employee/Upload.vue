<template>
  <div class="upload-page">
    <div class="upload-card upload-area-card">
      <div class="section-title">
        <el-icon :size="20"><Upload /></el-icon>
        <span>数据上传</span>
        <span class="section-sub">支持图片/文件/语音，上传后AI自动识别分类并汇入多维表格</span>
      </div>
      <el-upload
        class="upload-zone-wrap"
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        accept=".xlsx,.pdf,.docx,.csv,.jpg,.jpeg,.png,.mp3,.wav,.m4a,.amr"
      >
        <el-icon class="upload-icon" :size="56"><UploadFilled /></el-icon>
        <p class="upload-text">点击或拖拽文件到此区域上传</p>
        <p class="upload-hint">支持 .xlsx .pdf .docx .csv、图片及语音，单文件不超过20MB</p>
        <el-button type="primary" class="upload-btn">
          <el-icon><Upload /></el-icon>
          选择文件上传
        </el-button>
      </el-upload>
    </div>

    <div class="upload-card file-list-card">
      <div class="section-title">
        <el-icon :size="20"><FolderOpened /></el-icon>
        <span>已上传文件</span>
        <el-radio-group v-model="activeTab" size="small" class="category-tabs">
          <el-radio-button
            v-for="c in uploadCategories"
            :key="c.key"
            :value="c.key"
          >{{ c.label }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="file-table-header">
        <span class="file-col-name">文件名</span>
        <span class="file-col-category">分类</span>
        <span class="file-col-time">上传时间</span>
        <span class="file-col-size">文件大小</span>
      </div>
      <div class="file-list">
        <div v-for="file in filteredFiles" :key="file.id" class="file-row">
          <div class="file-col-name">
            <el-icon class="file-icon" :size="20">
              <Microphone v-if="isAudio(file.name)" style="color: #1a56db;" />
              <Picture v-else-if="isImage(file.name)" style="color: #8b5cf6;" />
              <Document v-else-if="file.name.includes('xlsx')" style="color: #10b981;" />
              <DocumentChecked v-else-if="file.name.includes('pdf')" style="color: #ef4444;" />
              <Document v-else />
            </el-icon>
            <div class="file-name-wrap">
              <span class="file-name-text">{{ file.name }}</span>
              <span v-if="file.aiNote" class="ai-note">
                <el-icon :size="13"><MagicStick /></el-icon>
                {{ file.aiStatus === 'recognizing' ? 'AI识别中...' : file.aiNote }}
              </span>
            </div>
          </div>
          <span class="file-col-category">
            <el-tag :type="categoryTagType(file.category)" size="small" effect="plain">{{ file.category }}</el-tag>
          </span>
          <span class="file-col-time file-meta">{{ file.uploadTime }}</span>
          <span class="file-col-size file-meta">{{ file.size }}</span>
        </div>
        <div v-if="filteredFiles.length === 0" class="empty-list">
          <el-icon :size="36"><FolderOpened /></el-icon>
          <p>该分类下暂无文件</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, UploadFilled, FolderOpened, Document, DocumentChecked, Picture, Microphone, MagicStick } from '@element-plus/icons-vue'
import { uploadedFiles, uploadCategories } from '../../mock/data'

const files = ref(uploadedFiles.map(f => ({ ...f })))
const activeTab = ref('all')

const categoryLabelMap = {
  visit: '拜访记录',
  feedback: '客户反馈',
  shop: '巡店照片',
  competitor: '竞品信息'
}

function categoryTagType(category) {
  const map = { '拜访记录': 'primary', '客户反馈': 'success', '巡店照片': 'warning', '竞品信息': 'danger' }
  return map[category] || 'info'
}

const filteredFiles = computed(() => {
  if (activeTab.value === 'all') return files.value
  const label = categoryLabelMap[activeTab.value]
  return files.value.filter(f => f.category === label)
})

function isImage(name) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
}

function isAudio(name) {
  return /\.(mp3|wav|m4a|amr|flac|aac)$/i.test(name)
}

// 模拟 AI 语音转写示例（演示用）
const voiceTranscripts = [
  { category: '客户反馈', text: '客户反馈：山姆渠道冷柜陈列需优化，希望增加脆皮炸鸡翅排面，并同步供货节奏' },
  { category: '拜访记录', text: '拜访记录：门店端架巡查完成，确认新品试吃排期，竞品安井锁鲜装6.0已在端架特价' },
  { category: '客户反馈', text: '客户反馈：渠道回款周期偏长，期望调整为30天账期并增加季末返点' }
]

function formatSize(bytes) {
  if (!bytes) return '0 KB'
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return mb.toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}

function formatNow() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleFileChange(file) {
  const image = isImage(file.name)
  const audio = isAudio(file.name)
  const aiTarget = image || audio
  const entry = {
    id: Date.now(),
    name: file.name,
    uploadTime: formatNow(),
    size: formatSize(file.size),
    category: '其他',
    aiStatus: aiTarget ? 'recognizing' : null,
    aiNote: aiTarget ? '' : null
  }
  files.value.unshift(entry)
  ElMessage.success('上传成功，数据已写入多维表格')

  // 模拟 AI 自动识别分类
  if (image) {
    setTimeout(() => {
      if (/竞品|安井|思念|皇家小虎/i.test(file.name)) {
        entry.category = '竞品信息'
        entry.aiNote = 'AI识别：竞品照片 → 品牌「安井」、单品「锁鲜装6.0」、促销「端架限时特价」'
      } else {
        entry.category = '巡店照片'
        entry.aiNote = 'AI识别：巡店照片 → 门店端架位置、在架SKU 12款、陈列面积正常'
      }
      entry.aiStatus = 'done'
      ElMessage.success(`AI已自动归类为「${entry.category}」`)
    }, 1800)
  } else if (audio) {
    setTimeout(() => {
      const picked = voiceTranscripts[Math.floor(Math.random() * voiceTranscripts.length)]
      entry.category = picked.category
      entry.aiNote = `AI语音转写：${picked.text}`
      entry.aiStatus = 'done'
      ElMessage.success(`AI已完成语音转写并归类为「${entry.category}」`)
    }, 1800)
  }
}
</script>

<style scoped>
.upload-page {
  max-width: 960px;
  margin: 0 auto;
}

.upload-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.06);
  border: 1px solid #e2e8f0;
}

.upload-area-card {
  margin-bottom: 24px;
}

.section-title {
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

.section-sub {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 8px;
}

.upload-zone-wrap :deep(.el-upload-dragger) {
  border: 2px dashed #bfdbfe;
  border-radius: 12px;
  padding: 48px 32px;
  background: #f8fafc;
  transition: all 0.3s;
}

.upload-zone-wrap :deep(.el-upload-dragger:hover) {
  border-color: #1a56db;
  background: #eff6ff;
}

.upload-icon {
  color: #93c5fd;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 20px;
}

.upload-btn {
  border-radius: 8px;
}

.file-list-card {
  padding-bottom: 20px;
}

.category-tabs {
  margin-left: auto;
}

.file-table-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}

.file-list {
  display: flex;
  flex-direction: column;
}

.file-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.file-row:last-child {
  border-bottom: none;
}

.file-row:hover {
  background: #f8fafc;
  border-radius: 8px;
}

.file-col-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.file-name-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.file-icon {
  flex-shrink: 0;
  color: #1a56db;
}

.file-name-text {
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-note {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8b5cf6;
  background: #f5f3ff;
  border-radius: 6px;
  padding: 2px 8px;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-col-category {
  width: 100px;
  text-align: center;
  flex-shrink: 0;
}

.file-col-time {
  width: 180px;
  text-align: center;
  flex-shrink: 0;
}

.file-col-size {
  width: 90px;
  text-align: right;
  flex-shrink: 0;
}

.file-meta {
  font-size: 13px;
  color: #64748b;
}

.empty-list {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
}

.empty-list .el-icon {
  color: #bfdbfe;
  margin-bottom: 8px;
}

.empty-list p {
  font-size: 13px;
}
</style>
