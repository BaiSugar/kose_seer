<template>
  <div class="server-page space-y-6">
    <!-- 服务器状态卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-lg font-semibold">在线人数</span>
              <el-icon class="text-2xl text-blue-500"><User /></el-icon>
            </div>
          </template>
          <div class="text-center">
            <div class="text-4xl font-bold text-blue-600">{{ serverStatus.onlinePlayers }}</div>
            <div class="text-sm text-gray-500 mt-2">当前在线玩家</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-lg font-semibold">总玩家数</span>
              <el-icon class="text-2xl text-green-500"><UserFilled /></el-icon>
            </div>
          </template>
          <div class="text-center">
            <div class="text-4xl font-bold text-green-600">{{ serverStatus.totalPlayers }}</div>
            <div class="text-sm text-gray-500 mt-2">注册玩家总数</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-lg font-semibold">运行时间</span>
              <el-icon class="text-2xl text-purple-500"><Clock /></el-icon>
            </div>
          </template>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ formatUptime(serverStatus.uptime) }}</div>
            <div class="text-sm text-gray-500 mt-2">服务器运行时长</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-lg font-semibold">内存使用</span>
              <el-icon class="text-2xl text-orange-500"><Monitor /></el-icon>
            </div>
          </template>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {{ formatMemory(serverStatus.memory?.heapUsed) }}
            </div>
            <div class="text-sm text-gray-500 mt-2">
              / {{ formatMemory(serverStatus.memory?.heapTotal) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 在线玩家列表 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">在线玩家列表</h3>
        <el-button type="primary" size="small" @click="loadData">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="p-6">
        <el-table :data="onlinePlayers" border stripe v-loading="loading">
          <el-table-column prop="userID" label="UID" width="100" />
          <el-table-column prop="nick" label="昵称" width="150" />
          <el-table-column prop="petMaxLev" label="最高等级" width="100" />
          <el-table-column prop="coins" label="金币" width="120">
            <template #default="{ row }">
              {{ row.coins?.toLocaleString() || 0 }}
            </template>
          </el-table-column>
          <el-table-column prop="vipLevel" label="VIP等级" width="100" />
          <el-table-column prop="mapID" label="当前地图" width="100" />
          <el-table-column prop="regTime" label="注册时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.regTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="warning" @click="kickPlayer(row)">
                踢出
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, UserFilled, Clock, Monitor, Refresh } from '@element-plus/icons-vue'
import { gmApi } from '@/api/gm'

const serverStatus = ref<any>({
  uptime: 0,
  memory: {},
  onlinePlayers: 0,
  totalPlayers: 0
})

const onlinePlayers = ref<any[]>([])
const loading = ref(false)
let refreshTimer: number | null = null

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadStatus(), loadOnlinePlayers()])
  } finally {
    loading.value = false
  }
}

const loadStatus = async () => {
  try {
    const result = await gmApi.getServerStatus()
    serverStatus.value = result.data || result
  } catch (error) {
    ElMessage.error('获取服务器状态失败')
  }
}

const loadOnlinePlayers = async () => {
  try {
    const result = await gmApi.getPlayers({
      page: 1,
      limit: 1000, // 获取所有在线玩家
      onlineOnly: true
    })
    const data = result.data || result
    onlinePlayers.value = data.players || []
  } catch (error) {
    ElMessage.error('获取在线玩家失败')
  }
}

const kickPlayer = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要踢出玩家 ${row.nick} 吗？`, '确认', {
      type: 'warning'
    })
    await gmApi.kickPlayer(row.userID)
    ElMessage.success('玩家已踢出')
    loadOnlinePlayers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('踢出失败')
    }
  }
}

const formatUptime = (seconds: number) => {
  if (!seconds) return '0天 0小时 0分钟'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}天 ${hours}小时 ${minutes}分钟`
}

const formatMemory = (bytes: number) => {
  if (!bytes) return '0 MB'
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  // 如果时间戳小于10000000000，说明是秒级时间戳，需要转换为毫秒
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadData()
  
  // 每5秒自动刷新（实时监控）
  refreshTimer = window.setInterval(() => {
    loadData()
  }, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.server-page {
  padding: 20px;
}

:deep(.el-card__header) {
  padding: 12px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
