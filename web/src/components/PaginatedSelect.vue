<template>
  <div class="paginated-select w-full">
    <el-select
      v-model="localValue"
      :filterable="filterable"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      class="w-full"
      popper-class="paginated-select-dropdown"
      @visible-change="handleVisibleChange"
      @change="handleChange"
    >
      <template #header>
        <div v-if="showSearch" class="px-3 py-2 border-b border-gray-200">
          <el-input
            v-model="searchQuery"
            placeholder="输入ID或名称搜索"
            size="small"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-option
        v-for="item in displayOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />

      <template #footer>
        <div class="px-3 py-2 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <span class="text-xs text-gray-500">
            共 {{ total }} 项，显示 {{ displayOptions.length }} 项
          </span>
          <div class="flex items-center gap-2">
            <el-button
              size="small"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              上一页
            </el-button>
            <span class="text-xs text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
            <el-button
              size="small"
              :disabled="currentPage >= totalPages"
              @click="nextPage"
            >
              下一页
            </el-button>
          </div>
        </div>
      </template>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

interface Props {
  modelValue: number | string | null
  placeholder?: string
  disabled?: boolean
  filterable?: boolean
  showSearch?: boolean
  fetchData: (query: string, page: number, pageSize: number) => Promise<{ items: any[], total: number }>
  pageSize?: number
}

interface Emits {
  (e: 'update:modelValue', value: number | string | null): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  disabled: false,
  filterable: false,
  showSearch: true,
  pageSize: 50
})

const emit = defineEmits<Emits>()

const localValue = ref(props.modelValue)
const searchQuery = ref('')
const currentPage = ref(1)
const displayOptions = ref<any[]>([])
const total = ref(0)
const loading = ref(false)

const totalPages = computed(() => Math.ceil(total.value / props.pageSize))

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const result = await props.fetchData(searchQuery.value, currentPage.value, props.pageSize)
    displayOptions.value = result.items
    total.value = result.total
  } catch (error) {
    console.error('加载数据失败:', error)
    displayOptions.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadData()
  }
}

// 下拉框显示/隐藏
const handleVisibleChange = (visible: boolean) => {
  if (visible && displayOptions.value.length === 0) {
    loadData()
  }
}

// 值变化
const handleChange = (value: number | string | null) => {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.paginated-select {
  width: 100%;
  display: block;
}

:deep(.el-select) {
  width: 100% !important;
  display: block;
}

:deep(.el-input) {
  width: 100% !important;
}

:deep(.el-input__wrapper) {
  width: 100% !important;
}

:deep(.el-input__inner) {
  width: 100% !important;
}
</style>

<style>
.paginated-select-dropdown .el-select-dropdown__item {
  padding: 8px 12px;
}

.paginated-select-dropdown .el-select-dropdown__header {
  padding: 0;
}

.paginated-select-dropdown .el-select-dropdown__footer {
  padding: 0;
}
</style>
