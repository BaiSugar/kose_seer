import { Request, Response } from 'express';
import { ServerService } from '../services/ServerService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 服务器管理控制器
 */
export class ServerController {
  private serverService: ServerService;

  constructor() {
    this.serverService = new ServerService();
  }

  /**
   * 获取服务器状态
   */
  public getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.serverService.getServerStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      Logger.Error('[ServerController] 获取服务器状态失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 全服公告
   */
  public sendAnnouncement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, type } = req.body;
      await this.serverService.sendAnnouncement(message, type);
      res.json({ success: true, message: '公告发送成功' });
    } catch (error) {
      Logger.Error('[ServerController] 发送公告失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 服务器维护
   */
  public maintenance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { enabled, message } = req.body;
      await this.serverService.setMaintenance(enabled, message);
      res.json({ success: true, message: enabled ? '维护模式已开启' : '维护模式已关闭' });
    } catch (error) {
      Logger.Error('[ServerController] 设置维护模式失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
