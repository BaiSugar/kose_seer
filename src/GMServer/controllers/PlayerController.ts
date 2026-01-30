import { Request, Response } from 'express';
import { PlayerService } from '../services/PlayerService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 玩家管理控制器
 */
export class PlayerController {
  private playerService: PlayerService;

  constructor() {
    this.playerService = new PlayerService();
  }

  /**
   * 获取玩家列表
   */
  public getPlayers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 20, search, onlineOnly } = req.query;
      const result = await this.playerService.getPlayers(
        Number(page),
        Number(limit),
        search as string,
        onlineOnly === 'true' || onlineOnly === '1'
      );
      res.json({ success: true, data: result });
    } catch (error) {
      Logger.Error('[PlayerController] 获取玩家列表失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 获取玩家详情
   */
  public getPlayerDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const player = await this.playerService.getPlayerDetail(Number(uid));
      res.json({ success: true, data: player });
    } catch (error) {
      Logger.Error(`[PlayerController] 获取玩家详情失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 修改玩家数据
   */
  public updatePlayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { field, value } = req.body;
      await this.playerService.updatePlayer(Number(uid), field, value);
      res.json({ success: true, message: '玩家数据修改成功' });
    } catch (error) {
      Logger.Error(`[PlayerController] 修改玩家数据失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 封禁/解封玩家
   */
  public banPlayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { banned, reason } = req.body;
      await this.playerService.banPlayer(Number(uid), banned, reason);
      res.json({ success: true, message: banned ? '玩家已封禁' : '玩家已解封' });
    } catch (error) {
      Logger.Error(`[PlayerController] 封禁/解封玩家失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 踢出玩家
   */
  public kickPlayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { reason } = req.body;
      await this.playerService.kickPlayer(Number(uid), reason);
      res.json({ success: true, message: '玩家已踢出' });
    } catch (error) {
      Logger.Error(`[PlayerController] 踢出玩家失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
