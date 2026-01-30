import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('gm_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 返回完整的响应对象，让调用方自己处理 success 字段
    return res
  },
  (error) => {
    console.error('Response error:', error)
    
    let message = '请求失败'
    if (error.response) {
      const status = error.response.status
      
      // 401 未认证，清除 token 并跳转登录
      if (status === 401) {
        localStorage.removeItem('gm_token')
        message = '登录已过期，请重新登录'
        // 可以在这里跳转到登录页
        // window.location.href = '/login'
      } else if (status === 403) {
        message = '权限不足'
      } else {
        message = error.response.data?.error || error.response.data?.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      message = '网络错误，请检查服务器连接'
    } else {
      message = error.message
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
