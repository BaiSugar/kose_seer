import { Router } from 'express';
import { PlayerController } from '../controllers/PlayerController';
import { whitelistMiddleware } from '../middleware/auth';

export const playerRouter = Router();
const playerController = new PlayerController();

// 玩家列表
playerRouter.get('/', playerController.getPlayers);

// 玩家详情
playerRouter.get('/:uid', playerController.getPlayerDetail);

// 修改玩家数据
playerRouter.patch('/:uid', playerController.updatePlayer);

// 封禁/解封玩家（需要白名单）
playerRouter.post('/:uid/ban', whitelistMiddleware('ban'), playerController.banPlayer);

// 踢出玩家（需要白名单）
playerRouter.post('/:uid/kick', whitelistMiddleware('ban'), playerController.kickPlayer);
