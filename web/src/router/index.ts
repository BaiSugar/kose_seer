import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/',
    redirect: '/config'
  },
  {
    path: '/config',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/config/map-ogres'
      },
      {
        path: 'map-ogres',
        name: 'MapOgres',
        component: () => import('@/views/config/MapOgres.vue'),
        meta: { title: '地图怪物配置' }
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('@/views/config/Tasks.vue'),
        meta: { title: '任务配置' }
      },
      {
        path: 'unique-items',
        name: 'UniqueItems',
        component: () => import('@/views/config/UniqueItems.vue'),
        meta: { title: '特殊物品配置' }
      }
    ]
  },
  {
    path: '/gm',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'players',
        name: 'Players',
        component: () => import('@/views/gm/Players.vue'),
        meta: { title: '玩家管理' }
      },
      {
        path: 'server',
        name: 'Server',
        component: () => import('@/views/gm/Server.vue'),
        meta: { title: '服务器管理' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/gm/Logs.vue'),
        meta: { title: '操作日志' }
      }
    ]
  },
  {
    path: '/demo',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'ComponentDemo',
        component: () => import('@/views/ComponentDemo.vue'),
        meta: { title: '组件演示' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查认证状态
router.beforeEach(async (to, _from, next) => {
  // 登录页面直接放行
  if (to.meta.noAuth) {
    next()
    return
  }

  // 检查是否有 token
  const token = localStorage.getItem('gm_token')
  
  // 如果没有 token，尝试访问 API 检查是否是本地访问
  if (!token) {
    try {
      const { gmApi } = await import('@/api/gm')
      await gmApi.getCurrentUser()
      // 本地访问成功，继续
      next()
    } catch (error) {
      // 需要登录
      next('/login')
    }
  } else {
    next()
  }
})

export default router
