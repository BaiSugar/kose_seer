<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <aside class="w-64 bg-white border-r border-gray-200 shadow-sm">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <el-icon :size="20" color="white"><Monitor /></el-icon>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">KOSE</h2>
            <p class="text-xs text-gray-500">配置管理系统</p>
          </div>
        </div>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        router
        class="border-none bg-white"
        text-color="#4b5563"
        active-text-color="#111827"
      >
        <el-sub-menu index="1">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span class="ml-2 font-medium">配置管理</span>
          </template>
          <el-menu-item index="/config/map-ogres" class="pl-12">
            <span class="text-sm">地图怪物</span>
          </el-menu-item>
          <el-menu-item index="/config/tasks" class="pl-12">
            <span class="text-sm">任务配置</span>
          </el-menu-item>
          <el-menu-item index="/config/unique-items" class="pl-12">
            <span class="text-sm">特殊物品</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="2">
          <template #title>
            <el-icon><User /></el-icon>
            <span class="ml-2 font-medium">GM管理</span>
          </template>
          <el-menu-item index="/gm/players" class="pl-12">
            <span class="text-sm">玩家管理</span>
          </el-menu-item>
          <el-menu-item index="/gm/server" class="pl-12">
            <span class="text-sm">服务器管理</span>
          </el-menu-item>
          <el-menu-item index="/gm/logs" class="pl-12">
            <span class="text-sm">操作日志</span>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/demo">
          <el-icon><Grid /></el-icon>
          <span class="ml-2 font-medium">组件演示</span>
        </el-menu-item>
      </el-menu>
    </aside>
    
    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部栏 -->
      <header class="bg-white border-b border-gray-200 shadow-sm">
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-900">{{ currentTitle }}</h3>
          </div>
          
          <div class="flex items-center gap-2">
            <div v-if="userInfo" class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <el-tag v-if="userInfo.isLocal" type="success" size="small">
                <el-icon class="mr-1"><HomeFilled /></el-icon>
                本地访问
              </el-tag>
              <el-tag v-else size="small" type="info">
                <span class="flex items-center gap-1">
                  <el-icon><User /></el-icon>
                  {{ userInfo.email }}
                </span>
              </el-tag>
            </div>
            
            <el-button 
              :icon="Refresh" 
              @click="handleRefresh"
              size="default"
            >
              刷新
            </el-button>
            
            <el-button 
              type="primary" 
              :icon="Connection" 
              @click="checkConnection"
              size="default"
            >
              连接状态
            </el-button>
            
            <el-button 
              v-if="userInfo && !userInfo.isLocal" 
              @click="handleLogout"
              type="danger"
              plain
              size="default"
            >
              登出
            </el-button>
          </div>
        </div>
      </header>
      
      <!-- 内容区 -->
      <main class="flex-1 overflow-auto p-6 bg-gray-50">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Setting, User, Refresh, Connection, Monitor, HomeFilled } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { gmApi } from '@/api/gm'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title as string || '配置管理')

interface UserInfo {
  userId: number
  email: string
  isLocal: boolean
  permissions: string[]
}

const userInfo = ref<UserInfo | null>(null)

// 获取当前用户信息
const fetchUserInfo = async () => {
  try {
    const response = await gmApi.getCurrentUser() as any
    if (response.success) {
      userInfo.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 登出
const handleLogout = async () => {
  try {
    await gmApi.logout()
    localStorage.removeItem('gm_token')
    ElMessage.success('登出成功')
    router.push('/login')
  } catch (error) {
    console.error('登出失败:', error)
    // 即使登出失败也清除本地token
    localStorage.removeItem('gm_token')
    router.push('/login')
  }
}

const handleRefresh = () => {
  router.go(0)
}

const checkConnection = async () => {
  try {
    await configStore.checkHealth()
    ElMessage.success('服务器连接正常')
  } catch (error) {
    ElMessage.error('服务器连接失败')
  }
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
/* Element Plus 菜单样式覆盖 */
:deep(.el-menu) {
  background-color: white !important;
}

:deep(.el-sub-menu__title) {
  color: #4b5563 !important;
  font-weight: 500;
  padding-left: 20px !important;
  transition: all 0.3s;
  border-radius: 0.5rem;
  margin: 0.25rem 0.75rem;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

:deep(.el-menu-item) {
  color: #6b7280 !important;
  transition: all 0.3s;
  border-radius: 0.5rem;
  margin: 0.25rem 0.75rem;
}

:deep(.el-menu-item:hover) {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

:deep(.el-menu-item.is-active) {
  background: #1f2937 !important;
  color: #ffffff !important;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: auto !important;
}
</style>
