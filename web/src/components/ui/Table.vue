<template>
  <div class="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div v-if="$slots.header" class="border-b border-gray-200 bg-gray-50 px-6 py-4">
      <slot name="header" />
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width }"
              :class="[
                'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider',
                column.align === 'center' ? 'text-center' : '',
                column.align === 'right' ? 'text-right' : ''
              ]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="(row, index) in data"
            :key="index"
            class="hover:bg-gray-50 transition-colors duration-150"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-4 py-3 text-sm text-gray-900',
                column.align === 'center' ? 'text-center' : '',
                column.align === 'right' ? 'text-right' : ''
              ]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :index="index">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="!data || data.length === 0">
            <td :colspan="columns.length" class="px-4 py-8 text-center text-sm text-gray-500">
              <div class="flex flex-col items-center gap-2">
                <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span>{{ emptyText }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="$slots.footer" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: Column[]
  data: any[]
  emptyText?: string
}

withDefaults(defineProps<Props>(), {
  emptyText: '暂无数据'
})
</script>
