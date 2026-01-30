import { defineStore } from 'pinia'
import { ref } from 'vue'
import { configApi } from '@/api/config'
import type { ConfigMetadata } from '@/types/config'

export const useConfigStore = defineStore('config', () => {
  const metadata = ref<Record<string, ConfigMetadata>>({})
  const options = ref<Record<string, any[]>>({})
  const petNames = ref<Record<number, string>>({})
  const itemNames = ref<Record<number, string>>({})
  const taskNames = ref<Record<number, string>>({})
  const skillNames = ref<Record<number, string>>({})
  const loading = ref(false)

  // 获取配置元数据
  const fetchMetadata = async () => {
    loading.value = true
    try {
      const res = await configApi.getMetadata() as any
      // 响应拦截器返回完整对象 { success, data }
      metadata.value = res.data || res
    } finally {
      loading.value = false
    }
  }

  // 获取精灵名字映射
  const fetchPetNames = async () => {
    if (Object.keys(petNames.value).length > 0) return petNames.value
    
    const res = await configApi.getPetNames() as any
    const data = res.data || res
    petNames.value = data
    return data
  }

  // 获取物品名字映射
  const fetchItemNames = async () => {
    if (Object.keys(itemNames.value).length > 0) return itemNames.value
    
    const res = await configApi.getItemNames() as any
    const data = res.data || res
    itemNames.value = data
    return data
  }

  // 获取任务名字映射
  const fetchTaskNames = async () => {
    if (Object.keys(taskNames.value).length > 0) return taskNames.value
    
    const res = await configApi.getTaskNames() as any
    const data = res.data || res
    taskNames.value = data
    return data
  }

  // 获取技能名字映射
  const fetchSkillNames = async () => {
    if (Object.keys(skillNames.value).length > 0) return skillNames.value
    
    const res = await configApi.getSkillNames() as any
    const data = res.data || res
    skillNames.value = data
    return data
  }

  // 获取下拉选项
  const fetchOptions = async (type: string) => {
    if (options.value[type]) return options.value[type]
    
    const res = await configApi.getOptions(type) as any
    const data = res.data || res
    options.value[type] = data
    return data
  }

  // 获取配置数据
  const fetchConfig = async (type: string) => {
    const res = await configApi.getConfig(type) as any
    // 响应拦截器返回完整对象 { success, data }
    return res.data || res
  }

  // 保存配置
  const saveConfig = async (type: string, data: any) => {
    const res = await configApi.saveConfig(type, data) as any
    if (res.success === false) {
      throw new Error(res.error || '保存失败')
    }
  }

  // 重载配置
  const reloadConfig = async (type: string) => {
    const res = await configApi.reloadConfig(type) as any
    if (res.success === false) {
      throw new Error(res.error || '重载失败')
    }
  }

  // 检查健康状态
  const checkHealth = async () => {
    const res = await configApi.checkHealth() as any
    return res.data || res
  }

  return {
    metadata,
    options,
    petNames,
    itemNames,
    taskNames,
    skillNames,
    loading,
    fetchMetadata,
    fetchPetNames,
    fetchItemNames,
    fetchTaskNames,
    fetchSkillNames,
    fetchOptions,
    fetchConfig,
    saveConfig,
    reloadConfig,
    checkHealth
  }
})
