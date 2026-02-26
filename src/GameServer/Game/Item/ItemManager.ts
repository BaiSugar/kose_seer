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
import { ItemEventType, IItemGainedEvent, ItemGainSource } from '../Event/EventTypes';
import { BroadcastService } from '../Broadcast/BroadcastService';
import { PacketGoldBuyProduct } from '../../Server/Packet/Send/User/PacketGoldBuyProduct';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';

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
  private _broadcastService: BroadcastService = BroadcastService.Instance;

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
   * 同步服装数据到 PlayerData
   * 从 ItemData 提取服装物品（ID >= 100000）到 PlayerData.clothes
   */
  private syncClothesToPlayerData(): void {
    const clothItems = this.GetClothItems();
    
    this.Player.Data.clothes = clothItems.map(item => ({
      id: item.itemId,
      level: 0,
      count: item.count
    }));
    
    this.Player.Data.clothCount = this.Player.Data.clothes.length;
    
    Logger.Debug(`[ItemManager] 同步服装数据: UserID=${this.UserID}, 服装数量=${this.Player.Data.clothCount}`);
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

    // 如果是服装物品，同步到 PlayerData.clothes
    if (itemId >= 100000) {
      this.syncClothesToPlayerData();
    }

    // 发送成功响应（result = 0）
    await this.Player.SendPacket(new PacketItemBuy(playerData.coins, itemId, count, 0));
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 购买物品 ${itemId} x${count}, 剩余金币 ${playerData.coins}`);

    // 派发物品获得事件
    await this.Player.EventBus.Emit({
      type: ItemEventType.ITEM_GAINED,
      timestamp: Date.now(),
      playerId: this.UserID,
      itemId,
      count,
      source: ItemGainSource.BUY,
    } as IItemGainedEvent);
  }

  /**
   * 赠送物品（用于邮件附件、任务奖励等）
   * 
   * @param itemId 物品ID
   * @param count 数量
   * @returns 是否成功
   */
  public async GiveItem(itemId: number, count: number, source: ItemGainSource = ItemGainSource.GIVE): Promise<boolean> {
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
      
      // 如果是服装物品，同步到 PlayerData.clothes
      if (itemId >= 100000) {
        this.syncClothesToPlayerData();
      }
      
      Logger.Info(`[ItemManager] 赠送物品成功: UserId=${this.UserID}, ItemId=${itemId}, Count=${count}`);

      // 派发物品获得事件
      await this.Player.EventBus.Emit({
        type: ItemEventType.ITEM_GAINED,
        timestamp: Date.now(),
        playerId: this.UserID,
        itemId,
        count,
        source,
      } as IItemGainedEvent);

      return true;
    } catch (error) {
      Logger.Error(`[ItemManager] 赠送物品异常: ${error}`);
      return false;
    }
  }

  // ==================== 公开查询/操作 API ====================

  /**
   * 检查玩家是否拥有某物品
   */
  public HasItem(itemId: number): boolean {
    return this.ItemData.HasItem(itemId);
  }

  /**
   * 获取某物品的数量
   */
  public GetItemCount(itemId: number): number {
    const item = this.ItemData.ItemList.find(i => i.itemId === itemId);
    return item ? item.count : 0;
  }

  /**
   * 消耗物品
   * @returns 是否成功消耗
   */
  public ConsumeItem(itemId: number, count: number): boolean {
    const item = this.ItemData.ItemList.find(i => i.itemId === itemId);
    if (!item || item.count < count) return false;

    item.count -= count;
    if (item.count <= 0) {
      this.ItemData.ItemList = this.ItemData.ItemList.filter(i => i.itemId !== itemId);
    }
    Logger.Info(`[ItemManager] 消耗物品: UserId=${this.UserID}, ItemId=${itemId}, Count=${count}, Remaining=${item.count}`);
    return true;
  }

  /**
   * 获取服装物品列表（ID >= 100000 且 < 200000）
   */
  public GetClothItems(): Array<{ itemId: number; count: number }> {
    return this.ItemData.ItemList
      .filter(item =>
        (item.itemId >= 100001 && item.itemId <= 200000) ||
        (item.itemId >= 1300001 && item.itemId <= 1400000)
      )
      .map(item => ({ itemId: item.itemId, count: item.count }));
  }

  /**
   * 处理更换服装
   * 
   * @param clothIds 服装ID列表
   */
  public async HandleChangeCloth(clothIds: number[]): Promise<void> {
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 更换服装，共 ${clothIds.length} 件`);

    // 保存到 PlayerData（自动触发保存）
    this.Player.Data.clothIds = clothIds;
    Logger.Debug(`[ItemManager] 保存服装ID到数据库: ${JSON.stringify(clothIds)}`);

    // 发送响应给自己
    await this.Player.SendPacket(new PacketChangeCloth(this.UserID, clothIds));

    // 广播给同地图其他玩家
    const mapId = OnlineTracker.Instance.GetPlayerMap(this.UserID);
    if (mapId > 0) {
      const sentCount = await this._broadcastService.BroadcastToMap(
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

    // 1300001-1400000 范围实际返回 100001-101000 的物品
    let actualRangeStart = itemType1;
    let actualRangeEnd = itemType2;
    if (itemType1 === 1300001 && itemType2 === 1400000) {
      actualRangeStart = 100001;
      actualRangeEnd = 101000;
      Logger.Debug(`[ItemManager] 映射物品范围: ${itemType1}-${itemType2} -> ${actualRangeStart}-${actualRangeEnd}`);
    }

    for (const item of allItems) {
      const itemId = item.itemId;
      
      // 检查是否在请求范围内
      const inRange = (actualRangeStart === 0 && actualRangeEnd === 0) || 
                      (itemId >= actualRangeStart && itemId <= actualRangeEnd) ||
                      itemId === itemType3;
      if (inRange) {
        if (!addedItems.has(itemId)) {
          addedItems.add(itemId);
          
          // flag: 0=装备物品(显示人物身上), 2=收藏物品, 3=超能NONO物品
          // 根据请求范围设置 flag（对齐 go-server）
          let itemFlag = 0;
          if (itemType1 === 300001 && itemType2 === 500000) {
            itemFlag = 2; // 收藏物品栏
          } else if (itemType1 === 100001 && itemType2 === 500000) {
            itemFlag = 3; // 超能NONO物品栏
          }
          // 其余(100001-101000、1300001-1400000、全量等)保持 0
          
          Logger.Debug(`[ItemManager] 物品详情: itemId=${itemId}, count=${item.count}, expireTime=${item.expireTime}, flag=${itemFlag}, range=${itemType1}-${itemType2}`);
          
          filteredItems.push({
            itemId: item.itemId,
            count: item.count,
            expireTime: item.expireTime,
            unknown: itemFlag
          });
        }
      }
    }

    // 发送响应
    await this.Player.SendPacket(new PacketItemList(filteredItems));
    Logger.Info(`[ItemManager] 玩家 ${this.UserID} 物品列表响应，共 ${filteredItems.length} 个物品`);
  }

  /**
   * 处理金豆购买商品
   * @param productId 商品ID
   * @param count 购买数量
   */
  public async HandleGoldBuyProduct(productId: number, count: number): Promise<void> {
    try {
      // 验证数量
      if (count <= 0) {
        Logger.Warn(`[ItemManager] 金豆购买数量无效: Count=${count}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.GOLD_BUY_PRODUCT).setResult(5001));
        return;
      }

      // 获取商品配置
      const product = GameConfig.GetProductById(productId);
      if (!product) {
        Logger.Warn(`[ItemManager] 商品不存在: ProductId=${productId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.GOLD_BUY_PRODUCT).setResult(5001));
        return;
      }

      // 验证物品存在（如果商品关联了物品）
      if (product.itemID > 0 && !ItemSystem.Exists(product.itemID)) {
        Logger.Warn(`[ItemManager] 商品关联的物品不存在: ItemId=${product.itemID}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.GOLD_BUY_PRODUCT).setResult(5001));
        return;
      }

      // 检查唯一性物品
      if (product.itemID > 0 && ItemSystem.IsUniqueItem(product.itemID)) {
        if (this.HasItem(product.itemID)) {
          Logger.Warn(`[ItemManager] 唯一物品已拥有: ItemId=${product.itemID}`);
          await this.Player.SendPacket(new PacketEmpty(CommandID.GOLD_BUY_PRODUCT).setResult(103203));
          return;
        }
      }

      // 检查是否VIP
      const isVip = this.Player.Data.vip > 0;

      // 计算价格（考虑VIP折扣）
      let unitPrice = product.price;
      if (isVip && product.vip > 0 && product.vip < 1) {
        unitPrice = Math.floor(product.price * product.vip);
      }
      const totalCost = unitPrice * count;

      // 检查金豆是否足够
      const currentGold = this.Player.Data.gold || 0;
      if (currentGold < totalCost) {
        Logger.Warn(`[ItemManager] 金豆不足: 需要=${totalCost}, 拥有=${currentGold}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.GOLD_BUY_PRODUCT).setResult(10016));
        return;
      }

      // 扣除金豆
      this.Player.Data.gold = currentGold - totalCost;

      // 添加物品
      if (product.itemID > 0) {
        await this.GiveItem(product.itemID, count, ItemGainSource.GOLD_BUY);
        Logger.Info(`[ItemManager] 金豆购买添加物品: ItemId=${product.itemID}, Count=${count}`);
      }

      // 赠送赛尔豆（配置中的 gold 字段表示赠送的赛尔豆数量）
      if (product.gold > 0) {
        const giftCoins = product.gold * count;
        this.Player.Data.coins += giftCoins;
        Logger.Info(`[ItemManager] 金豆购买赠送赛尔豆: ${giftCoins}, 新余额=${this.Player.Data.coins}`);
      }

      // 发送成功响应
      await this.Player.SendPacket(new PacketGoldBuyProduct(totalCost, this.Player.Data.gold || 0));

      Logger.Info(
        `[ItemManager] 金豆购买成功: UserID=${this.UserID}, ` +
        `ProductId=${productId}, ItemId=${product.itemID}, Count=${count}, ` +
        `UnitPrice=${unitPrice}, TotalCost=${totalCost}, CoinsGift=${product.gold * count}, ` +
        `RemainingGold=${this.Player.Data.gold}, VIP=${isVip}, Discount=${isVip && product.vip ? product.vip : 1}`
      );
    } catch (error) {
      Logger.Error(`[ItemManager] HandleGoldBuyProduct 处理失败`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.GOLD_BUY_PRODUCT).setResult(5000));
    }
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
