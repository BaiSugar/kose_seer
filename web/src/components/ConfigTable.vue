<template>
  <div class="config-table">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">{{ metadata.name }}</h3>
        <div class="flex gap-2">
          <el-button :icon="Plus" @click="handleAdd">添加行</el-button>
          <el-button :icon="Upload" @click="handleSave" type="primary">保存配置</el-button>
          <el-button :icon="Refresh" @click="handleReload" type="success">重载配置</el-button>
        </div>
      </div>

      <div class="p-6">
        <el-table
          :data="tableData"
          border
          stripe
          style="width: 100%"
          max-height="calc(100vh - 300px)"
          class="excel-table"
        >
          <el-table-column type="index" width="50" label="#" fixed />
          
          <el-table-column
            v-for="field in metadata.fields"
            :key="field.key"
            :prop="field.key"
            :label="field.label"
            :min-width="getColumnWidth(field)"
          >
            <template #header>
              <div class="column-header">
                <span>{{ field.label }}</span>
                <el-tooltip v-if="field.required" content="必填项" placement="top">
                  <el-icon color="#ef4444"><StarFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            
            <template #default="{ row }">
              <!-- 文本输入 -->
              <el-input
                v-if="field.type === 'text'"
                v-model="row[field.key]"
                :placeholder="field.label"
                size="small"
              />
              
              <!-- 数字输入 -->
              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="row[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                :controls="false"
                size="small"
                style="width: 100%"
              />
              
              <!-- 下拉选择 -->
              <el-select
                v-else-if="field.type === 'select'"
                v-model="row[field.key]"
                :placeholder="`选择${field.label}`"
                :multiple="field.multiple"
                filterable
                size="small"
                style="width: 100%"
                @focus="loadOptions(field.options as string)"
              >
                <el-option
                  v-for="option in getOptions(field.options as string)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              
              <!-- 布尔值 -->
              <el-switch
                v-else-if="field.type === 'boolean'"
                v-model="row[field.key]"
                size="small"
              />
              
              <!-- 文本域 -->
              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="row[field.key]"
                type="textarea"
                :rows="2"
                :placeholder="field.label"
                size="small"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button
                :icon="Delete"
                type="danger"
                size="small"
                @click="handleDelete($index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Refresh, Delete, StarFilled } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import type { ConfigMetadata } from '@/types/config'

interface Props {
  configType: string
  metadata: ConfigMetadata
}

const props = defineProps<Props>()
const configStore = useConfigStore()

const tableData = ref<any[]>([])
const optionsCache = ref<Record<string, any[]>>({})

// 加载配置数据
const loadData = async () => {
  try {
    const data = await configStore.fetchConfig(props.configType)
    tableData.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error('加载配置失败')
  }
}

// 加载下拉选项
const loadOptions = async (optionsType: string) => {
  if (optionsCache.value[optionsType]) return
  
  try {
    const options = await configStore.fetchOptions(optionsType)
    optionsCache.value[optionsType] = options as any[]
  } catch (error) {
    console.error('加载选项失败:', error)
  }
}

// 获取选项
const getOptions = (optionsType: string | string[]) => {
  if (Array.isArray(optionsType)) {
    return optionsType.map(v => ({ value: v, label: v }))
  }
  return optionsCache.value[optionsType] || []
}

// 获取列宽
const getColumnWidth = (field: any) => {
  const widthMap: Record<string, number> = {
    text: 150,
    number: 120,
    select: 200,
    boolean: 80,
    textarea: 250
  }
  return widthMap[field.type] || 150
}

// 添加行
const handleAdd = () => {
  const newRow: any = {}
  props.metadata.fields.forEach(field => {
    if (field.type === 'boolean') {
      newRow[field.key] = false
    } else if (field.type === 'number') {
      newRow[field.key] = field.min || 0
    } else if (field.type === 'select' && field.multiple) {
      newRow[field.key] = []
    } else {
      newRow[field.key] = ''
    }
  })
  tableData.value.push(newRow)
  ElMessage.success('已添加新行')
}

// 删除行
const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这一行吗？', '提示', {
      type: 'warning'
    })
    tableData.value.splice(index, 1)
    ElMessage.success('已删除')
  } catch {
    // 取消删除
  }
}

// 保存配置
const handleSave = async () => {
  try {
    await configStore.saveConfig(props.configType, tableData.value)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('配置保存失败')
  }
}

// 重载配置
const handleReload = async () => {
  try {
    await ElMessageBox.confirm(
      '重载配置会立即应用到游戏服务器，确定要继续吗？',
      '确认重载',
      { type: 'warning' }
    )
    
    await configStore.reloadConfig(props.configType)
    ElMessage.success('配置重载成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('配置重载失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.config-table {
  /* No additional styles needed */
}

.column-header {
  display: flex;
  align-items: center;
  gap: 5px;
}

:deep(.excel-table) {
  font-size: 13px;
}

:deep(.excel-table .el-table__header th) {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}

:deep(.excel-table .el-input__inner),
:deep(.excel-table .el-input-number__decrease),
:deep(.excel-table .el-input-number__increase) {
  border: none;
  background: transparent;
}

:deep(.excel-table .el-input:hover .el-input__inner),
:deep(.excel-table .el-input:focus .el-input__inner) {
  border: 1px solid #9ca3af;
}
</style>
