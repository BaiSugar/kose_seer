import { PlayerInstance } from '../Player/PlayerInstance';

/**
 * Manager 基类
 * 所有玩家相关的 Manager 都应该继承此类
 * 
 * 参考 DanhengServer 的 BasePlayerManager 设计：
 * - 只提供 Player 属性
 * - Manager 中直接使用 Player.SendPacket()
 * - 不提供便捷方法，保持简单
 */
export abstract class BaseManager {
  public Player: PlayerInstance;
  
  constructor(player: PlayerInstance) {
    this.Player = player;
  }
  
  /**
   * 获取玩家 UserID（便捷访问）
   */
  protected get UserID(): number {
    return this.Player.UserID;
  }
  
  /**
   * Manager 初始化
   * 子类可以重写此方法来执行初始化逻辑
   * 
   * @example
   * public async Initialize(): Promise<void> {
   *   await super.Initialize();
   *   // 加载玩家数据
   *   this._items = await this._itemRepo.FindByUserId(this.UserID);
   * }
   */
  public async Initialize(): Promise<void> {
    // 子类可以重写
  }
  
  /**
   * 玩家登出时清理
   * 子类可以重写此方法来执行清理逻辑
   * 
   * @example
   * public async OnLogout(): Promise<void> {
   *   await super.OnLogout();
   *   // 保存数据
   *   await this._itemRepo.SaveAll(this._items);
   *   // 清理缓存
   *   this._items = [];
   * }
   */
  public async OnLogout(): Promise<void> {
    // 子类可以重写
  }
}
