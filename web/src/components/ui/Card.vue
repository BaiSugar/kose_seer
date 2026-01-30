<template>
  <div :class="['bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden', props.class]">
    <div v-if="$slots.header || title" class="bg-gray-900 px-6 py-4">
      <slot name="header">
        <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
      </slot>
    </div>
    
    <div :class="['p-6', noPadding ? '!p-0' : '']">
      <slot />
    </div>

    <div v-if="$slots.footer" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  noPadding?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  noPadding: false
})
</script>
