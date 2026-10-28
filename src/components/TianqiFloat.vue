<template>
  <div>
    <transition name="float">
      <div v-if="showBtn" class="tianqi-float-btn" @click="handleOpen">
        <el-badge :value="unreadCount" :hidden="!unreadCount" :max="99">
          <div class="float-btn-inner">
            <el-icon :size="26"><ChatDotRound /></el-icon>
            <span class="btn-label">飞书</span>
          </div>
        </el-badge>
      </div>
    </transition>

    <teleport to="body">
      <div v-if="drawerVisible" class="tianqi-overlay" @click.self="handleClose">
        <div class="tianqi-drawer">
          <div class="drawer-header">
            <div class="header-left">
              <el-avatar :size="42" style="background: linear-gradient(135deg, #1a56db, #3b82f6);">
                <el-icon :size="22"><Connection /></el-icon>
              </el-avatar>
              <div class="header-text">
                <span class="header-name">天启 AI助手</span>
                <span class="header-status">
                  <span class="status-dot"></span>
                  {{ roleLabel }} · 在线
                </span>
              </div>
            </div>
            <el-button text @click="handleClose" class="close-btn">
              <el-icon :size="20"><Close /></el-icon>
            </el-button>
          </div>

          <div class="messages-area" ref="messagesRef">
            <div v-for="msg in messages" :key="msg.id" class="message-item">
              <div :class="['message-row', msg.role === 'user' ? 'user-row' : '']">
                <template v-if="msg.role === 'assistant'">
                  <div class="avatar assistant-avatar">
                    <el-icon :size="18"><Connection /></el-icon>
                  </div>
                  <div class="message-content">
                    <div class="msg-name">飞书</div>
                    <div class="msg-bubble assistant-bubble">
                      <div class="bubble-text" v-html="renderText(msg.content)"></div>
                      <div class="bubble-time">{{ msg.time }}</div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="message-content user-content">
                    <div class="msg-bubble user-bubble">
                      <div class="bubble-text">{{ msg.content }}</div>
                      <div class="bubble-time user-time">{{ msg.time }}</div>
                    </div>
                  </div>
                  <div class="avatar user-avatar">
                    {{ currentUser?.name?.[0] || '我' }}
                  </div>
                </template>
              </div>
            </div>
            <div v-if="isLoading" class="message-item">
              <div class="message-row">
                <div class="avatar assistant-avatar">
                  <el-icon :size="18"><Connection /></el-icon>
                </div>
                <div class="message-content">
                  <div class="msg-name">飞书</div>
                  <div class="msg-bubble assistant-bubble">
                    <div class="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="input-area">
            <div class="quick-prompts">
              <span
                v-for="p in quickPrompts"
                :key="p"
                class="quick-chip"
                @click="sendQuickPrompt(p)"
              >{{ p }}</span>
            </div>
            <el-input
              v-model="inputText"
              placeholder="输入消息，按 Enter 发送..."
              size="large"
              :disabled="isLoading"
              @keyup.enter="sendMessage"
            >
              <template #suffix>
                <el-button
                  type="primary"
                  class="send-btn"
                  :icon="Promotion"
                  circle
                  :disabled="!inputText.trim() || isLoading"
                  @click="sendMessage"
                />
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { ChatDotRound, Close, Connection, Promotion } from '@element-plus/icons-vue'
import { tianqiMessages } from '../mock/data'
import { useTianqi } from '../composables/useTianqi'
import { askTianqi, QUICK_PROMPTS, ROLE_LABELS } from '../composables/useTianqiAI'

// 各角色初始对话（演示首屏效果）
const INITIAL_MESSAGES = {
  employee: tianqiMessages,
  supervisor: [
    { id: 1, role: 'assistant', content: '您好！我是天启，华东区域主管的AI助手。可帮您做竞品促销汇总、异常态势统计、客户挽留话术等分析。', time: '2026-07-15 09:00:00' },
    { id: 2, role: 'user', content: '本周华东竞品促销汇总', time: '2026-07-15 09:01:00' },
    { id: 3, role: 'assistant', content: '本周华东区域监测到竞品变动：安井「锁鲜装6.0」在上海会员店限时特价，影响我司盐酥鸡/鸡米花排面。AI建议：投放组合装试吃，突出「0添加+全产业链」差异化卖点，避免直接价格战。', time: '2026-07-15 09:01:30' }
  ],
  executive: [
    { id: 1, role: 'assistant', content: '您好！我是天启，集团高层战略助手。可帮您做区域对比、增长拐点、异常健康度、Q3经营报告等分析。', time: '2026-07-15 09:00:00' },
    { id: 2, role: 'user', content: '异常处理健康度如何？', time: '2026-07-15 09:01:00' },
    { id: 3, role: 'assistant', content: '当前异常处理健康度 82分（良好）。按时处理率91%、闭环率88%、平均响应效率76%，较上月提升6分。价格异常响应已从4.5天压缩至4小时内。', time: '2026-07-15 09:01:30' }
  ]
}

const emit = defineEmits(['open', 'close'])

const { tianqiVisible, openTianqi, closeTianqi } = useTianqi()

const drawerVisible = ref(false)
const inputText = ref('')
const unreadCount = ref(2)
const isLoading = ref(false)
const messagesRef = ref(null)
const messages = ref([])
const currentUser = ref(null)
const showBtn = ref(true)

const role = computed(() => currentUser.value?.role || 'employee')
const roleLabel = computed(() => ROLE_LABELS[role.value] || '员工')
const quickPrompts = computed(() => QUICK_PROMPTS[role.value] || QUICK_PROMPTS.employee)

onMounted(() => {
  const userStr = sessionStorage.getItem('currentUser')
  if (userStr) currentUser.value = JSON.parse(userStr)
  const initial = INITIAL_MESSAGES[role.value] || INITIAL_MESSAGES.employee
  messages.value = initial.map(m => ({ ...m }))
})

watch(tianqiVisible, (val) => {
  if (val) {
    drawerVisible.value = true
    unreadCount.value = 0
  } else {
    drawerVisible.value = false
  }
})

function handleOpen() {
  drawerVisible.value = true
  unreadCount.value = 0
  emit('open')
}

function handleClose() {
  drawerVisible.value = false
  closeTianqi()
  emit('close')
}

function renderText(text) {
  if (!text) return ''
  return text.replace(/\n/g, '<br/>')
}

function sendMessage() {
  if (!inputText.value.trim() || isLoading.value) return

  const userMessage = {
    id: messages.value.length + 1,
    role: 'user',
    content: inputText.value,
    time: new Date().toLocaleString('zh-CN')
  }
  messages.value.push(userMessage)
  const question = inputText.value
  inputText.value = ''
  scrollToBottom()

  isLoading.value = true
  setTimeout(() => {
    const reply = {
      id: messages.value.length + 1,
      role: 'assistant',
      content: askTianqi(role.value, question),
      time: new Date().toLocaleString('zh-CN')
    }
    messages.value.push(reply)
    isLoading.value = false
    scrollToBottom()
  }, 900)
}

function sendQuickPrompt(prompt) {
  if (isLoading.value) return
  inputText.value = prompt
  sendMessage()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.tianqi-float-btn {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 999;
  cursor: pointer;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.float-btn-inner {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 24px rgba(26, 86, 219, 0.45);
  transition: all 0.3s;
}

.float-btn-inner:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(26, 86, 219, 0.55);
}

.btn-label {
  font-size: 10px;
  margin-top: 1px;
  font-weight: 500;
}

.float-enter-active, .float-leave-active {
  transition: all 0.3s;
}
.float-enter-from, .float-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.tianqi-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tianqi-drawer {
  width: 440px;
  height: 100%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.header-name {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.header-status {
  font-size: 12px;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
}

.close-btn {
  color: #94a3b8;
}
.close-btn:hover {
  color: #1e293b;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  flex-shrink: 0;
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row.user-row {
  justify-content: flex-end;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 600;
  font-size: 14px;
}

.assistant-avatar {
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  color: white;
}

.user-avatar {
  background: #10b981;
  color: white;
}

.message-content {
  max-width: 70%;
}

.user-content {
  display: flex;
  justify-content: flex-end;
}

.msg-name {
  font-size: 12px;
  color: #1a56db;
  margin-bottom: 4px;
  font-weight: 500;
}

.msg-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
}

.assistant-bubble {
  background: white;
  border: 1px solid #e2e8f0;
  border-top-left-radius: 2px;
}

.user-bubble {
  background: linear-gradient(135deg, #1a56db, #2563eb);
  color: white;
  border-top-right-radius: 2px;
}

.bubble-text {
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}

.user-time {
  color: rgba(255, 255, 255, 0.7);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

.input-area {
  padding: 12px 20px 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.quick-chip {
  font-size: 12px;
  color: #1a56db;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.quick-chip:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.input-area :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding-right: 4px;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
}

.input-area :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1a56db inset !important;
}

.send-btn {
  --el-button-size: 34px;
}
</style>
