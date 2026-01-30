import request from '@/utils/request'

export const configApi = {
  // 获取配置元数据
  getMetadata() {
    return request.get('/api/config/metadata')
  },

  // 获取精灵名字映射
  getPetNames() {
    return request.get('/api/config/pet-names')
  },

  // 获取物品名字映射
  getItemNames() {
    return request.get('/api/config/item-names')
  },

  // 获取任务名字映射
  getTaskNames() {
    return request.get('/api/config/task-names')
  },

  // 获取技能名字映射
  getSkillNames() {
    return request.get('/api/config/skill-names')
  },

  // 获取配置数据
  getConfig(type: string) {
    return request.get(`/api/config/${type}`)
  },

  // 保存配置
  saveConfig(type: string, data: any) {
    return request.post(`/api/config/${type}`, { data })
  },

  // 重载配置
  reloadConfig(type: string) {
    return request.post(`/api/config/${type}/reload`)
  },

  // 获取下拉选项
  getOptions(type: string) {
    return request.get(`/api/config/options/${type}`)
  },

  // 搜索精灵选项（分页）
  searchPets(query: string = '', page: number = 1, pageSize: number = 50) {
    return request.get('/api/config/search/pets', {
      params: { query, page, pageSize }
    })
  },

  // 搜索物品选项（分页）
  searchItems(query: string = '', page: number = 1, pageSize: number = 50) {
    return request.get('/api/config/search/items', {
      params: { query, page, pageSize }
    })
  },

  // 健康检查
  checkHealth() {
    return request.get('/health')
  }
}
