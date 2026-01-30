import { Router } from 'express';
import { LogController } from '../controllers/LogController';

export const logRouter = Router();
const logController = new LogController();

// 获取操作日志
logRouter.get('/', logController.getLogs);

// 记录操作日志
logRouter.post('/', logController.addLog);
