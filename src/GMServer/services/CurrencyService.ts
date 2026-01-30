import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';

/**
 * 货币管理服务
 */
export class CurrencyService {
  /**
   * 修改金币（增加或减少）
   */
  public async modifyCoins(uid: number, amount: number): Promise<void> {
    const playerData = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
    if (!playerData) {
      throw new Error('玩家不存在');
    }

    playerData.coins += amount;
    Logger.Info(`[CurrencyService] 修改金币: uid=${uid}, amount=${amount}, newCoins=${playerData.coins}`);
  }

  /**
   * 设置金币（直接设置）
   */
  public async setCoins(uid: number, amount: number): Promise<void> {
    const playerData = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
    if (!playerData) {
      throw new Error('玩家不存在');
    }

    playerData.coins = amount;
    Logger.Info(`[CurrencyService] 设置金币: uid=${uid}, coins=${amount}`);
  }

  /**
   * 获取玩家货币信息
   */
  public async getCurrency(uid: number): Promise<any> {
    const playerData = await DatabaseHelper.Instance.GetInstance_PlayerData(uid);
    if (!playerData) {
      throw new Error('玩家不存在');
    }

    return {
      coins: playerData.coins,
      // 可以添加其他货币类型
    };
  }
}
