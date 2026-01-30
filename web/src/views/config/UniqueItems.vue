<template>
  <div class="unique-items-page space-y-6">
    <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
          <el-icon :size="24" color="white"><Box /></el-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">特殊物品配置说明</h3>
          <p class="text-sm text-gray-600">
            配置特殊物品的效果和使用条件。
          </p>
        </div>
      </div>
    </div>

    <ConfigTable
      v-if="metadata"
      config-type="unique-items"
      :metadata="metadata"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Box } from '@element-plus/icons-vue'
import ConfigTable from '@/components/ConfigTable.vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const metadata = ref<any>(null)

onMounted(async () => {
  await configStore.fetchMetadata()
  metadata.value = configStore.metadata['unique-items']
})
</script>

<style scoped>
/* No additional styles needed */
</style>
