import request from '@/utils/request'

export const gmApi = {
  // ==================== 认证相关 ====================
  
  // 登录
  login(email: string, password: string) {
    return request.post('/api/auth/login', { email, password })
  },

  // 登出
  logout() {
    return request.post('/api/auth/logout')
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/api/auth/current')
  },

  // 获取白名单列表
  getWhitelist() {
    return request.get('/api/auth/whitelist')
  },

  // 添加白名单
  addToWhitelist(userId: number, email: string, permissions: string[], note?: string) {
    return request.post('/api/auth/whitelist', { userId, email, permissions, note })
  },

  // 移除白名单
  removeFromWhitelist(userId: number) {
    return request.delete('/api/auth/whitelist', { data: { userId } })
  },

  // ==================== 玩家管理 ====================
  
  // 获取玩家列表
  getPlayers(params: { page: number; limit: number; search?: string; onlineOnly?: boolean }) {
    return request.get('/api/players', { params })
  },

  // 获取玩家详情
  getPlayerDetail(uid: number) {
    return request.get(`/api/players/${uid}`)
  },

  // 修改玩家数据
  updatePlayer(uid: number, field: string, value: any) {
    return request.patch(`/api/players/${uid}`, { field, value })
  },

  // 封禁/解封玩家
  banPlayer(uid: number, banned: boolean, reason?: string) {
    return request.post(`/api/players/${uid}/ban`, { banned, reason })
  },

  // 踢出玩家
  kickPlayer(uid: number, reason?: string) {
    return request.post(`/api/players/${uid}/kick`, { reason })
  },

  // 发送物品
  giveItem(uid: number, itemId: number, count: number) {
    return request.post(`/api/items/${uid}`, { itemId, count })
  },

  // 发送精灵
  givePet(uid: number, petId: number, level: number, shiny: boolean) {
    return request.post(`/api/pets/${uid}`, { petId, level, shiny })
  },

  // 修改金币
  modifyCoins(uid: number, amount: number) {
    return request.patch(`/api/currency/${uid}/coins`, { amount })
  },

  // ==================== 服务器管理 ====================

  // 获取服务器状态
  getServerStatus() {
    return request.get('/api/server/status')
  },

  // 全服公告
  sendAnnouncement(message: string, type: string) {
    return request.post('/api/server/announcement', { message, type })
  },

  // 获取在线玩家
  getOnlinePlayers() {
    return request.get('/api/server/online')
  },

  // ==================== 日志查询 ====================

  // 获取操作日志
  getLogs(params: { page: number; limit: number; type?: string; uid?: number }) {
    return request.get('/api/logs', { params })
  }
}
