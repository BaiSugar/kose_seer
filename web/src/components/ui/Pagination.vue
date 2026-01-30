<template>
  <div class="flex items-center justify-between">
    <div class="text-sm text-gray-700">
      显示 <span class="font-medium">{{ startItem }}</span> 到 <span class="font-medium">{{ endItem }}</span> 条，
      共 <span class="font-medium">{{ total }}</span> 条
    </div>
    
    <div class="flex items-center gap-2">
      <!-- Previous Button -->
      <button
        :disabled="currentPage === 1"
        :class="[
          'px-3 py-1.5 rounded-md border text-sm font-medium transition-colors duration-200',
          currentPage === 1
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        ]"
        @click="goToPage(currentPage - 1)"
      >
        上一页
      </button>

      <!-- Page Numbers -->
      <div class="flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'min-w-[2.5rem] px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200',
            page === currentPage
              ? 'bg-gray-900 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- Next Button -->
      <button
        :disabled="currentPage === totalPages"
        :class="[
          'px-3 py-1.5 rounded-md border text-sm font-medium transition-colors duration-200',
          currentPage === totalPages
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        ]"
        @click="goToPage(currentPage + 1)"
      >
        下一页
      </button>

      <!-- Page Size Selector -->
      <select
        v-if="showPageSize"
        :value="pageSize"
        :class="[
          'ml-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm',
          'focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
          'transition-colors duration-200'
        ]"
        @change="handlePageSizeChange"
      >
        <option v-for="size in pageSizes" :key="size" :value="size">
          {{ size }} 条/页
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  pageSize: number
  total: number
  pageSizes?: number[]
  showPageSize?: boolean
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  pageSizes: () => [10, 20, 50, 100],
  showPageSize: true,
  maxVisiblePages: 7
})

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize
  return end > props.total ? props.total : end
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = props.currentPage
  const max = props.maxVisiblePages

  if (total <= max) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    const half = Math.floor(max / 2)
    let start = current - half
    let end = current + half

    if (start < 1) {
      start = 1
      end = max
    }
    if (end > total) {
      end = total
      start = total - max + 1
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
  emit('change', page)
}

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newSize = Number(target.value)
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1)
}
</script>
