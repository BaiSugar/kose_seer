import { Request, Response } from 'express';
import { LogService } from '../services/LogService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 日志管理控制器
 */
export class LogController {
  private logService: LogService;

  constructor() {
    this.logService = new LogService();
  }

  /**
   * 获取操作日志
   */
  public getLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 50, type, uid } = req.query;
      const logs = await this.logService.getLogs(
        Number(page),
        Number(limit),
        type as string,
        uid ? Number(uid) : undefined
      );
      res.json({ success: true, data: logs });
    } catch (error) {
      Logger.Error('[LogController] 获取日志失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 记录操作日志
   */
  public addLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, uid, operator, action, details } = req.body;
      await this.logService.addLog(type, uid, operator, action, details);
      res.json({ success: true, message: '日志记录成功' });
    } catch (error) {
      Logger.Error('[LogController] 记录日志失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
