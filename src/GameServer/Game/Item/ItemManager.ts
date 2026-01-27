import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { GameConfig } from '../../../shared/config';
import { PacketItemBuy, PacketChangeCloth, PacketItemList } from '../../Server/Packet/Send';
import { IItemData } from '../../../shared/proto/packets/rsp/item/ItemListRspProto';
import { PlayerInstance } from '../Player/PlayerInstance';
import { OnlineTracker } from '../Player/OnlineTracker';
import { ItemSystem } from './ItemSystem';

/**
 * 物品管理器
 * 处理物品相关的所有逻辑：购买物品、更换服装、物品列表等
 * 
 * 架构说明：
 * - 继承 BaseManager 获得便捷方法（Player、UserID、SendPacket）
 * - 使用 Player.ItemRepo 和 Player.PlayerRepo 访问数据库
 */
export class ItemManager extends BaseManager {
  constructor(player: PlayerInstance) {
    super(player);
  }

  /**
   * 处理购买物品
   * 
   * @param itemId 物品ID
   * @param count 购买数量
   */
  public async HandleItemBuy(itemId: number, count: number): Promise<void> {
    // 使用缓存的玩家信息
    const playerInfo = this.Player.PlayerRepo.data;

    // 检查唯一性
    if (ItemSystem.IsUniqueItem(itemId)) {
      const hasItem = await this.Player.ItemRepo.HasItem(itemId);
      if (hasItem) {
        Logger.Warn(`[ItemManager] 物品 ${itemId} 是唯一物品且用户已拥有，返回错误码 103203`);
        await this.Player.SendPacket(new PacketItemBuy(playerInfo.coins, itemId, count, 0).setResult(103203));
        return;
      }
    }

    // 获取物品价格
    const unitPrice = this.getItemPrice(itemId);
    const totalCost = unitPrice * count;

    // 检查金币是否足够
    if (playerInfo.coins < totalCost) {
      Logger.Warn(`[ItemManager] 金币不足! 需要 ${totalCost}, 拥有 ${playerInfo.coins}`);
      await this.Player.SendPacket(new PacketItemBuy(playerInfo.coins, itemId, count, 0).setResult(10016));
      return;
    }

    // 扣除金币
    if (totalCost > 0) {
      await this.Player.PlayerRepo.AddCurrency(undefined, -totalCost);
      Logger.Info(`[ItemManager] 扣除 ${totalCost} 金币 (单价 ${unitPrice}), 剩余 ${playerInfo.coins - totalCost}`);
    }

    // 添加物品到数据库
    await this.Player.ItemRepo.AddItem(itemId, count, 0x057E40, 0);

    // 发送成功响应（result = 0）
    await this.Player.SendPacket(new PacketItemBuy(playerInfo.coins - totalCost, itemId, count, 0));
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 购买物品 ${itemId} x${count}, 剩余金币 ${playerInfo.coins - totalCost}`);
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
      // 检查物品是否存在
      if (!ItemSystem.Exists(itemId)) {
        Logger.Warn(`[ItemManager] 物品不存在: ItemId=${itemId}`);
        return false;
      }

      // 添加物品到数据库
      const success = await this.Player.ItemRepo.AddItem(itemId, count, 0x057E40, 0);
      
      if (success) {
        Logger.Info(`[ItemManager] 赠送物品成功: UserId=${this.UserID}, ItemId=${itemId}, Count=${count}`);
      } else {
        Logger.Warn(`[ItemManager] 赠送物品失败: UserId=${this.UserID}, ItemId=${itemId}, Count=${count}`);
      }
      
      return success;
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
        this.UserID // 排除自己
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

    // 从数据库读取玩家的所有物品
    const allItems = await this.Player.ItemRepo.FindByOwnerId();

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
