import { Request, Response } from 'express';
import { ItemService } from '../services/ItemService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 物品管理控制器
 */
export class ItemController {
  private itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  /**
   * 发送物品
   */
  public giveItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { itemId, count } = req.body;
      await this.itemService.giveItem(Number(uid), itemId, count);
      res.json({ success: true, message: '物品发送成功' });
    } catch (error) {
      Logger.Error(`[ItemController] 发送物品失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 批量发送物品
   */
  public giveItemBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { items } = req.body; // [{ itemId, count }]
      await this.itemService.giveItemBatch(Number(uid), items);
      res.json({ success: true, message: '批量发送物品成功' });
    } catch (error) {
      Logger.Error(`[ItemController] 批量发送物品失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 删除物品
   */
  public removeItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { itemId, count } = req.body;
      await this.itemService.removeItem(Number(uid), itemId, count);
      res.json({ success: true, message: '物品删除成功' });
    } catch (error) {
      Logger.Error(`[ItemController] 删除物品失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 获取玩家物品列表
   */
  public getPlayerItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const items = await this.itemService.getPlayerItems(Number(uid));
      res.json({ success: true, data: items });
    } catch (error) {
      Logger.Error(`[ItemController] 获取玩家物品失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
