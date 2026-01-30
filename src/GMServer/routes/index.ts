import { Router } from 'express';
import authRouter from './auth';
import { playerRouter } from './player';
import { itemRouter } from './item';
import { petRouter } from './pet';
import { currencyRouter } from './currency';
import { serverRouter } from './server';
import { logRouter } from './log';
import { configRouter } from './config';
import { reloadRouter } from './reload';
import { authMiddleware, whitelistMiddleware } from '../middleware/auth';

export const apiRouter = Router();

// 认证路由（无需认证）
apiRouter.use('/auth', authRouter);

// 以下路由需要基础认证
apiRouter.use(authMiddleware);

// 玩家管理（查看无需白名单，封禁需要白名单）
apiRouter.use('/players', playerRouter);

// 物品管理
apiRouter.use('/items', itemRouter);

// 精灵管理
apiRouter.use('/pets', petRouter);

// 货币管理
apiRouter.use('/currency', currencyRouter);

// 服务器管理
apiRouter.use('/server', serverRouter);

// 日志管理
apiRouter.use('/logs', logRouter);

// 配置管理（需要白名单）
apiRouter.use('/config', whitelistMiddleware('config'), configRouter);

// 配置重载（需要白名单）
apiRouter.use('/reload', whitelistMiddleware('config'), reloadRouter);

// API 文档
apiRouter.get('/docs', (req, res) => {
  res.json({
    name: 'KOSE GM Server API',
    version: '2.0.0',
    description: '模块化 GM 管理 API',
    modules: {
      players: {
        description: '玩家管理',
        endpoints: {
          'GET /api/players': '获取玩家列表',
          'GET /api/players/:uid': '获取玩家详情',
          'PATCH /api/players/:uid': '修改玩家数据',
          'POST /api/players/:uid/ban': '封禁/解封玩家',
          'POST /api/players/:uid/kick': '踢出玩家'
        }
      },
      items: {
        description: '物品管理',
        endpoints: {
          'GET /api/items/:uid': '获取玩家物品列表',
          'POST /api/items/:uid': '发送物品',
          'POST /api/items/:uid/batch': '批量发送物品',
          'DELETE /api/items/:uid': '删除物品'
        }
      },
      pets: {
        description: '精灵管理',
        endpoints: {
          'GET /api/pets/:uid': '获取玩家精灵列表',
          'POST /api/pets/:uid': '发送精灵',
          'PATCH /api/pets/:uid': '修改精灵属性',
          'DELETE /api/pets/:uid': '删除精灵'
        }
      },
      currency: {
        description: '货币管理',
        endpoints: {
          'GET /api/currency/:uid': '获取玩家货币信息',
          'PATCH /api/currency/:uid/coins': '修改金币（增减）',
          'PUT /api/currency/:uid/coins': '设置金币（直接设置）'
        }
      },
      server: {
        description: '服务器管理',
        endpoints: {
          'GET /api/server/status': '获取服务器状态',
          'POST /api/server/announcement': '全服公告',
          'GET /api/server/online': '获取在线玩家',
          'POST /api/server/maintenance': '维护模式'
        }
      },
      logs: {
        description: '日志管理',
        endpoints: {
          'GET /api/logs': '获取操作日志',
          'POST /api/logs': '记录操作日志'
        }
      },
      config: {
        description: '配置管理',
        endpoints: {
          'GET /api/config/metadata': '获取配置元数据',
          'GET /api/config/:type': '获取配置数据',
          'POST /api/config/:type': '保存配置',
          'POST /api/config/:type/reload': '重载配置',
          'GET /api/config/options/:type': '获取下拉选项'
        }
      },
      reload: {
        description: '配置重载',
        endpoints: {
          'POST /api/reload/:type': '重载指定配置',
          'POST /api/reload': '重载所有配置',
          'GET /api/reload/status': '配置状态'
        }
      }
    }
  });
});
