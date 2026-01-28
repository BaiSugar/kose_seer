import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { GameConfig } from '../../../shared/config';
import { PacketItemBuy, PacketChangeCloth, PacketItemList } from '../../Server/Packet/Send';
import { IItemData } from '../../../shared/proto/packets/rsp/item/ItemListRspProto';
import { PlayerInstance } from '../Player/PlayerInstance';
import { OnlineTracker } from '../Player/OnlineTracker';
import { ItemSystem } from './ItemSystem';
import { ItemData } from '../../../DataBase/models/ItemData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';

/**
 * 物品管理器
 * 处理物品相关的所有逻辑：购买物品、更换服装、物品列表等
 * 
 * 架构说明：
 * - 继承 BaseManager 获得便捷方法（Player、UserID、SendPacket）
 * - 持有 ItemData 对象，直接操作数组
 * - 使用 DatabaseHelper 实时保存数据
 */
export class ItemManager extends BaseManager {
  /** 物品数据 */
  public ItemData!: ItemData;

  constructor(player: PlayerInstance) {
    super(player);
  }

  /**
   * 初始化（加载数据）
   */
  public async Initialize(): Promise<void> {
    this.ItemData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(this.UserID);
    Logger.Debug(`[ItemManager] 初始化完成: UserID=${this.UserID}, Items=${this.ItemData.ItemList.length}`);
  }

  /**
   * 处理购买物品
   * 
   * @param itemId 物品ID
   * @param count 购买数量
   */
  public async HandleItemBuy(itemId: number, count: number): Promise<void> {
    const playerData = this.Player.Data;

    // 检查唯一性
    if (ItemSystem.IsUniqueItem(itemId)) {
      if (this.ItemData.HasItem(itemId)) {
        Logger.Warn(`[ItemManager] 物品 ${itemId} 是唯一物品且用户已拥有，返回错误码 103203`);
        await this.Player.SendPacket(new PacketItemBuy(playerData.coins, itemId, count, 0).setResult(103203));
        return;
      }
    }

    // 获取物品价格
    const unitPrice = this.getItemPrice(itemId);
    const totalCost = unitPrice * count;

    // 检查金币是否足够
    if (playerData.coins < totalCost) {
      Logger.Warn(`[ItemManager] 金币不足! 需要 ${totalCost}, 拥有 ${playerData.coins}`);
      await this.Player.SendPacket(new PacketItemBuy(playerData.coins, itemId, count, 0).setResult(10016));
      return;
    }

    // 扣除金币（直接修改 PlayerData，自动保存）
    if (totalCost > 0) {
      playerData.coins -= totalCost;
      Logger.Info(`[ItemManager] 扣除 ${totalCost} 金币 (单价 ${unitPrice}), 剩余 ${playerData.coins}`);
    }

    // 添加物品（直接修改 ItemData）
    this.ItemData.AddItem(itemId, count, 0x057E40);
    await DatabaseHelper.Instance.SaveItemData(this.ItemData);

    // 发送成功响应（result = 0）
    await this.Player.SendPacket(new PacketItemBuy(playerData.coins, itemId, count, 0));
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 购买物品 ${itemId} x${count}, 剩余金币 ${playerData.coins}`);
  }

  /**
   * 赠送物品（用于邮件附件、任务奖励等）
   * 
   * @param itemId 物品ID
   * @param count 数量
   * @returns 是否成功
   */
  public async GiveItem(itemId: number, count: number): Promise<boolean> {
    try {
      // 调试日志
      Logger.Debug(`[ItemManager] GiveItem 开始: UserId=${this.UserID}, ItemId=${itemId}, Count=${count}, ItemData.Uid=${this.ItemData?.Uid}`);

      // 检查物品是否存在
      if (!ItemSystem.Exists(itemId)) {
        Logger.Warn(`[ItemManager] 物品不存在: ItemId=${itemId}`);
        return false;
      }

      // 添加物品（直接修改 ItemData）
      this.ItemData.AddItem(itemId, count, 0x057E40);
      
      Logger.Debug(`[ItemManager] 准备保存 ItemData: Uid=${this.ItemData.Uid}`);
      await DatabaseHelper.Instance.SaveItemData(this.ItemData);
      
      Logger.Info(`[ItemManager] 赠送物品成功: UserId=${this.UserID}, ItemId=${itemId}, Count=${count}`);
      return true;
    } catch (error) {
      Logger.Error(`[ItemManager] 赠送物品异常: ${error}`);
      return false;
    }
  }

  /**
   * 处理更换服装
   * 
   * @param clothIds 服装ID列表
   */
  public async HandleChangeCloth(clothIds: number[]): Promise<void> {
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 更换服装，共 ${clothIds.length} 件`);

    // 发送响应给自己
    await this.Player.SendPacket(new PacketChangeCloth(this.UserID, clothIds));

    // 广播给同地图其他玩家
    const mapId = OnlineTracker.Instance.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      const sentCount = await OnlineTracker.Instance.BroadcastToMap(
        mapId,
        new PacketChangeCloth(this.UserID, clothIds),
        this.UserID
      );
      Logger.Info(`[ItemManager] 广播服装变更到地图 ${mapId}，发送给 ${sentCount} 个玩家`);
    }

    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 更换服装完成`);
  }

  /**
   * 处理物品列表
   * 
   * @param itemType1 物品类型范围起始
   * @param itemType2 物品类型范围结束
   * @param itemType3 单个物品类型
   */
  public async HandleItemList(
    itemType1: number,
    itemType2: number,
    itemType3: number
  ): Promise<void> {
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 查询物品列表，范围: ${itemType1}-${itemType2}, 单个: ${itemType3}`);

    // 从 ItemData 读取所有物品
    const allItems = this.ItemData.ItemList;

    // 过滤符合范围的物品
    const filteredItems: IItemData[] = [];
    const addedItems = new Set<number>();

    for (const item of allItems) {
      const itemId = item.itemId;
      
      // 检查是否在请求范围内
      if ((itemId >= itemType1 && itemId <= itemType2) || itemId === itemType3) {
        if (!addedItems.has(itemId)) {
          addedItems.add(itemId);
          filteredItems.push({
            itemId: item.itemId,
            count: item.count,
            expireTime: item.expireTime,
            unknown: 0
          });
        }
      }
    }

    // 发送响应
    await this.Player.SendPacket(new PacketItemList(filteredItems));
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 物品列表响应，共 ${filteredItems.length} 个物品`);
  }

  /**
   * 获取物品价格
   */
  private getItemPrice(itemId: number): number {
    const itemConfig = GameConfig.GetItemById(itemId);
    if (!itemConfig) {
      Logger.Warn(`[ItemManager] 物品配置不存在: ${itemId}`);
      return 0;
    }

    return itemConfig.Price || 0;
  }
}
