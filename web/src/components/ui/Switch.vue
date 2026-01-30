<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      :class="[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        modelValue ? 'bg-gray-900' : 'bg-gray-200'
      ]"
      @click="toggle"
    >
      <span
        :class="[
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
          modelValue ? 'translate-x-6' : 'translate-x-1'
        ]"
      />
    </button>
    <label v-if="label" class="text-sm font-medium text-gray-700 cursor-pointer" @click="toggle">
      {{ label }}
    </label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const toggle = () => {
  if (!props.disabled) {
    const newValue = !props.modelValue
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}
</script>
