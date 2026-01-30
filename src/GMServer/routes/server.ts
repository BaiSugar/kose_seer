import { Router } from 'express';
import { ServerController } from '../controllers/ServerController';

export const serverRouter = Router();
const serverController = new ServerController();

// 获取服务器状态
serverRouter.get('/status', serverController.getStatus);

// 全服公告
serverRouter.post('/announcement', serverController.sendAnnouncement);

// 维护模式
serverRouter.post('/maintenance', serverController.maintenance);
