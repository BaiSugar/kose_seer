<template>
  <div class="logs-page">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">操作日志</h3>
          <div class="flex gap-2">
            <el-select v-model="filters.type" placeholder="日志类型" clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option label="玩家操作" value="player" />
              <el-option label="物品发送" value="item" />
              <el-option label="封禁操作" value="ban" />
              <el-option label="配置修改" value="config" />
            </el-select>
            <el-input
              v-model="filters.uid"
              placeholder="玩家UID"
              clearable
              style="width: 150px"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </div>

      <div class="p-6">
        <el-table :data="logs" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getLogTypeColor(row.type)">
                {{ getLogTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="uid" label="玩家UID" width="100" />
          <el-table-column prop="operator" label="操作者" width="120" />
          <el-table-column prop="action" label="操作" width="150" />
          <el-table-column prop="details" label="详情" min-width="200" />
          <el-table-column prop="timestamp" label="时间" width="180" />
        </el-table>

        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadLogs"
          @size-change="loadLogs"
          style="margin-top: 20px; justify-content: center"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { gmApi } from '@/api/gm'

const logs = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const filters = ref({
  type: '',
  uid: ''
})

const loadLogs = async () => {
  try {
    const data = await gmApi.getLogs({
      page: currentPage.value,
      limit: pageSize.value,
      type: filters.value.type,
      uid: filters.value.uid ? Number(filters.value.uid) : undefined
    }) as any
    logs.value = data.logs
    total.value = data.total
  } catch (error) {
    ElMessage.error('加载日志失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadLogs()
}

const getLogTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    player: 'primary',
    item: 'success',
    ban: 'danger',
    config: 'warning'
  }
  return colorMap[type] || 'info'
}

const getLogTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    player: '玩家操作',
    item: '物品发送',
    ban: '封禁操作',
    config: '配置修改'
  }
  return nameMap[type] || type
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
/* No additional styles needed */
</style>
