<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo 和标题 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl shadow-lg mb-4">
          <el-icon :size="32" color="white"><Monitor /></el-icon>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">KOSE</h1>
        <p class="text-gray-600 text-base">GM 管理系统</p>
      </div>

      <!-- 登录卡片 -->
      <div class="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6 text-center">欢迎登录</h2>
        
        <el-form :model="loginForm" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
          <el-form-item prop="email" class="mb-5">
            <div class="space-y-2 w-full">
              <label class="text-sm font-medium text-gray-700 flex items-center gap-1">
                <el-icon><Message /></el-icon>
                邮箱地址
              </label>
              <el-input 
                v-model="loginForm.email" 
                placeholder="请输入邮箱"
                size="large"
                :prefix-icon="Message"
                class="w-full"
              />
            </div>
          </el-form-item>
          
          <el-form-item prop="password" class="mb-6">
            <div class="space-y-2 w-full">
              <label class="text-sm font-medium text-gray-700 flex items-center gap-1">
                <el-icon><Lock /></el-icon>
                密码
              </label>
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
                class="w-full"
              />
            </div>
          </el-form-item>
          
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleLogin" 
            size="large"
            class="w-full !h-12 !text-base !font-semibold"
          >
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form>
        
        <!-- 提示信息 -->
        <div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div class="flex items-start gap-2">
            <el-icon color="#6b7280" :size="18"><InfoFilled /></el-icon>
            <p class="text-sm text-gray-600 flex-1">
              本地运行无需登录，远程访问需要使用游戏账号登录
            </p>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="text-center mt-6 text-gray-500 text-sm">
        <p>© 2024 KOSE Server. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, Message, Lock, InfoFilled } from '@element-plus/icons-vue'
import { gmApi } from '@/api/gm'
import md5 from 'md5'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    
    loading.value = true
    try {
      // MD5 加密密码
      const hashedPassword = md5(loginForm.password)
      
      const res = await gmApi.login(loginForm.email, hashedPassword) as any
      
      // 保存 token
      localStorage.setItem('gm_token', res.token)
      
      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
/* Element Plus 表单样式覆盖 */
:deep(.el-input__wrapper) {
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 0.3s;
  border: 1px solid #d1d5db;
}

:deep(.el-input__wrapper:hover) {
  border-color: #9ca3af;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #1f2937;
  box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.1);
}

:deep(.el-form-item__error) {
  padding-top: 0.25rem;
}
</style>
