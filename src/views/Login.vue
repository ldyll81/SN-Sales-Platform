<template>
  <div class="login-page">
    <div class="login-bg-animation">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">
          <el-icon :size="32"><Connection /></el-icon>
        </div>
        <h1 class="login-title">圣农智能销售指挥平台</h1>
        <p class="login-subtitle">Enterprise Intelligent Management Platform</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="id">
          <el-input
            v-model="form.id"
            placeholder="请输入工号"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入姓名"
            size="large"
          >
            <template #prefix>
              <el-icon><EditPen /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>测试账号：001(员工) / 002(主管) / 003(高层) &nbsp;密码均为：123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, EditPen, Lock, Connection } from '@element-plus/icons-vue'
import { users } from '../mock/data'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  id: '',
  name: '',
  password: ''
})

const rules = {
  id: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

function handleLogin() {
  formRef.value.validate((valid) => {
    if (!valid) return

    loading.value = true
    setTimeout(() => {
      const user = users[form.id]
      if (!user || user.password !== form.password || user.name !== form.name) {
        ElMessage.error('工号、姓名或密码错误，请重新输入')
        loading.value = false
        return
      }

      sessionStorage.setItem('currentUser', JSON.stringify(user))
      ElMessage.success(`欢迎回来，${user.name}！`)

      const roleMap = {
        employee: '/employee/tianqi',
        supervisor: '/supervisor/tianqi',
        executive: '/executive/tianqi'
      }
      router.push(roleMap[user.role])
    }, 600)
  })
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a1628 0%, #1a56db 50%, #2563eb 100%);
  position: relative;
  overflow: hidden;
}

.login-bg-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
}

.c1 {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, #60a5fa, transparent);
  top: -200px;
  right: -150px;
  animation: float 8s ease-in-out infinite;
}

.c2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #3b82f6, transparent);
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

.c3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #93c5fd, transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 12s ease-in-out infinite 2s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

.login-card {
  width: 440px;
  padding: 44px 40px 36px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  color: white;
  box-shadow: 0 8px 24px rgba(26, 86, 219, 0.3);
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 2px;
}

.login-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  letter-spacing: 1px;
}

.login-form {
  margin-bottom: 8px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 16px;
  box-shadow: 0 0 0 1px #e2e8f0 inset !important;
  transition: box-shadow 0.2s;
}

.login-form :deep(.el-input__wrapper:hover),
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1a56db inset !important;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #1a56db, #2563eb);
  border: none;
  transition: all 0.3s;
}

.login-btn:hover {
  background: linear-gradient(135deg, #1e40af, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(26, 86, 219, 0.35);
}

.login-footer p {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.6;
}
</style>
