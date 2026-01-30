import { Request, Response } from 'express';
import { CurrencyService } from '../services/CurrencyService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 货币管理控制器
 */
export class CurrencyController {
  private currencyService: CurrencyService;

  constructor() {
    this.currencyService = new CurrencyService();
  }

  /**
   * 修改金币
   */
  public modifyCoins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { amount } = req.body;
      await this.currencyService.modifyCoins(Number(uid), amount);
      res.json({ success: true, message: '金币修改成功' });
    } catch (error) {
      Logger.Error(`[CurrencyController] 修改金币失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 设置金币
   */
  public setCoins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const { amount } = req.body;
      await this.currencyService.setCoins(Number(uid), amount);
      res.json({ success: true, message: '金币设置成功' });
    } catch (error) {
      Logger.Error(`[CurrencyController] 设置金币失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 获取玩家货币信息
   */
  public getCurrency = async (req: Request, res: Response): Promise<void> => {
    try {
      const { uid } = req.params;
      const currency = await this.currencyService.getCurrency(Number(uid));
      res.json({ success: true, data: currency });
    } catch (error) {
      Logger.Error(`[CurrencyController] 获取货币信息失败: ${req.params.uid}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
