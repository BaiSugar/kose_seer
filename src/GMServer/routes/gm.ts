import { Router } from 'express';
import { GMService } from '../services/GMService';
import { Logger } from '../../shared/utils/Logger';

export const gmRouter = Router();
const gmService = new GMService();

// ==================== 玩家管理 ====================

// 获取玩家列表
gmRouter.get('/players', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await gmService.getPlayers(
      Number(page), 
      Number(limit), 
      search as string
    );
    res.json({ success: true, data: result });
  } catch (error) {
    Logger.Error('[GMRouter] 获取玩家列表失败', error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 获取玩家详情
gmRouter.get('/players/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const player = await gmService.getPlayerDetail(Number(uid));
    res.json({ success: true, data: player });
  } catch (error) {
    Logger.Error(`[GMRouter] 获取玩家详情失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 修改玩家数据
gmRouter.post('/players/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { field, value } = req.body;
    await gmService.updatePlayer(Number(uid), field, value);
    res.json({ success: true, message: '玩家数据修改成功' });
  } catch (error) {
    Logger.Error(`[GMRouter] 修改玩家数据失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 封禁/解封玩家
gmRouter.post('/players/:uid/ban', async (req, res) => {
  try {
    const { uid } = req.params;
    const { banned, reason } = req.body;
    await gmService.banPlayer(Number(uid), banned, reason);
    res.json({ success: true, message: banned ? '玩家已封禁' : '玩家已解封' });
  } catch (error) {
    Logger.Error(`[GMRouter] 封禁/解封玩家失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 踢出玩家
gmRouter.post('/players/:uid/kick', async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    await gmService.kickPlayer(Number(uid), reason);
    res.json({ success: true, message: '玩家已踢出' });
  } catch (error) {
    Logger.Error(`[GMRouter] 踢出玩家失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==================== 物品管理 ====================

// 发送物品
gmRouter.post('/players/:uid/items', async (req, res) => {
  try {
    const { uid } = req.params;
    const { itemId, count } = req.body;
    await gmService.giveItem(Number(uid), itemId, count);
    res.json({ success: true, message: '物品发送成功' });
  } catch (error) {
    Logger.Error(`[GMRouter] 发送物品失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 发送精灵
gmRouter.post('/players/:uid/pets', async (req, res) => {
  try {
    const { uid } = req.params;
    const { petId, level, shiny } = req.body;
    await gmService.givePet(Number(uid), petId, level, shiny);
    res.json({ success: true, message: '精灵发送成功' });
  } catch (error) {
    Logger.Error(`[GMRouter] 发送精灵失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 修改金币
gmRouter.post('/players/:uid/coins', async (req, res) => {
  try {
    const { uid } = req.params;
    const { amount } = req.body;
    await gmService.modifyCoins(Number(uid), amount);
    res.json({ success: true, message: '金币修改成功' });
  } catch (error) {
    Logger.Error(`[GMRouter] 修改金币失败: ${req.params.uid}`, error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==================== 服务器管理 ====================

// 获取服务器状态
gmRouter.get('/server/status', async (req, res) => {
  try {
    const status = await gmService.getServerStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    Logger.Error('[GMRouter] 获取服务器状态失败', error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 全服公告
gmRouter.post('/server/announcement', async (req, res) => {
  try {
    const { message, type } = req.body;
    await gmService.sendAnnouncement(message, type);
    res.json({ success: true, message: '公告发送成功' });
  } catch (error) {
    Logger.Error('[GMRouter] 发送公告失败', error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 获取在线玩家
// ==================== 日志查询 ====================

// 获取操作日志
gmRouter.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, uid } = req.query;
    const logs = await gmService.getLogs(
      Number(page),
      Number(limit),
      type as string,
      uid ? Number(uid) : undefined
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    Logger.Error('[GMRouter] 获取日志失败', error as Error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ==================== API 文档 ====================

gmRouter.get('/docs', (req, res) => {
  res.json({
    name: 'KOSE GM Server API',
    version: '1.0.0',
    endpoints: {
      players: {
        'GET /api/gm/players': '获取玩家列表',
        'GET /api/gm/players/:uid': '获取玩家详情',
        'POST /api/gm/players/:uid': '修改玩家数据',
        'POST /api/gm/players/:uid/ban': '封禁/解封玩家',
        'POST /api/gm/players/:uid/kick': '踢出玩家',
        'POST /api/gm/players/:uid/items': '发送物品',
        'POST /api/gm/players/:uid/pets': '发送精灵',
        'POST /api/gm/players/:uid/coins': '修改金币'
      },
      server: {
        'GET /api/gm/server/status': '获取服务器状态',
        'POST /api/gm/server/announcement': '全服公告',
        'GET /api/gm/server/online': '获取在线玩家'
      },
      logs: {
        'GET /api/gm/logs': '获取操作日志'
      },
      reload: {
        'POST /api/reload/:type': '重载配置'
      }
    }
  });
});
