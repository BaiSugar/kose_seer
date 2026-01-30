<template>
  <div class="w-full">
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    <div class="relative">
      <button
        :id="selectId"
        type="button"
        :disabled="disabled"
        :class="[
          'w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
          props.class
        ]"
        @click="toggleDropdown"
      >
        <span :class="selectedLabel ? 'text-gray-900' : 'text-gray-400'">
          {{ selectedLabel || placeholder }}
        </span>
        <svg class="h-4 w-4 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown -->
      <div
        v-if="isOpen"
        class="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
      >
        <div
          v-for="option in options"
          :key="option.value"
          :class="[
            'px-3 py-2 text-sm cursor-pointer transition-colors duration-150',
            option.value === modelValue
              ? 'bg-gray-900 text-white'
              : 'text-gray-900 hover:bg-gray-100'
          ]"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>

      <!-- Backdrop -->
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40"
        @click="closeDropdown"
      ></div>
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number
  options: Option[]
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const isOpen = ref(false)
const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || ''
})

const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectOption = (option: Option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}
</script>
