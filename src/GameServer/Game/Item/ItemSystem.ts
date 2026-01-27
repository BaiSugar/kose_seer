/**
 * 物品系统
 * 负责物品配置的读取和物品相关的逻辑处理
 * 
 * 移植自: luvit/luvit_version/game/seer_items.lua
 * 
 * 功能：
 * - 物品配置读取
 * - 物品信息查询
 * - 物品分类管理
 * - 物品属性获取
 */

import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Logger } from '../../../shared/utils';
import { IItem } from '../../../shared/config/XmlConfigInterfaces';

/**
 * 物品分类枚举
 */
export enum ItemCategory {
  MEDICINE = 1,        // 药品
  CAPTURE = 2,         // 捕捉道具
  EQUIPMENT = 3,       // 装备
  CLOTH_HEAD = 4,      // 服装-头部
  CLOTH_BODY = 5,      // 服装-身体
  CLOTH_FOOT = 6,      // 服装-脚部
  CLOTH_WAIST = 7,     // 服装-腰部
  CLOTH_HAND = 8,      // 服装-手部
  CLOTH_EYE = 9,       // 服装-眼部
  CLOTH_BACK = 10,     // 服装-背部
  MATERIAL = 11,       // 材料
  GIFT = 12,           // 礼物
  SPECIAL = 13         // 特殊物品
}

/**
 * 物品可交易性枚举
 */
export enum ItemTradability {
  NOT_TRADABLE = 0,    // 不可交易
  TRADABLE = 1,        // 可交易
  SELLABLE = 2,        // 可出售
  FULL = 3             // 完全可交易（可交易+可出售）
}

/**
 * 物品信息接口（扩展）
 */
export interface IItemInfo extends IItem {
  catId: number;       // 分类ID
  isVipOnly: boolean;  // 是否VIP专属
  tradability: number; // 可交易性
  vipTradability: number; // VIP可交易性
}

/**
 * 物品系统类
 */
export class ItemSystem {

  /**
   * 物品缓存
   * itemId -> IItemInfo
   */
  private static itemCache: Map<number, IItemInfo> | null = null;

  /**
   * 分类缓存
   * catId -> itemIds[]
   */
  private static categoryCache: Map<number, number[]> | null = null;

  /**
   * 唯一物品ID集合
   */
  private static uniqueItemIds: Set<number> | null = null;

  /**
   * 唯一物品范围列表
   */
  private static uniqueRanges: Array<{ start: number; end: number }> | null = null;

  /**
   * 加载物品数据
   */
  private static LoadItemData(): void {
    if (this.itemCache && this.categoryCache) {
      return;
    }

    try {
      const itemConfig = GameConfig.GetItemConfig();
      if (!itemConfig || !itemConfig.Items) {
        Logger.Warn('[ItemSystem] 物品配置未加载');
        this.itemCache = new Map();
        this.categoryCache = new Map();
        return;
      }

      this.itemCache = new Map();
      this.categoryCache = new Map();

      const categories = itemConfig.Items.Cat;
      if (!categories) {
        return;
      }

      const catArray = Array.isArray(categories) ? categories : [categories];

      for (const cat of catArray) {
        const catId = cat.ID;
        const items = cat.Item;

        if (!items) {
          continue;
        }

        const itemArray = Array.isArray(items) ? items : [items];
        const itemIds: number[] = [];

        for (const item of itemArray) {
          const itemId = item.ID;
          
          // 构建扩展的物品信息
          const itemInfo: IItemInfo = {
            ...item,
            catId: catId,
            isVipOnly: (item.VipOnly || 0) === 1,
            tradability: item.Tradability || 3,
            vipTradability: item.VipTradability || 3
          };

          this.itemCache.set(itemId, itemInfo);
          itemIds.push(itemId);
        }

        this.categoryCache.set(catId, itemIds);
      }

      Logger.Info(`[ItemSystem] 加载物品数据完成: ${this.itemCache.size} 个物品, ${this.categoryCache.size} 个分类`);
    } catch (error) {
      Logger.Error('[ItemSystem] 加载物品数据失败', error as Error);
      this.itemCache = new Map();
      this.categoryCache = new Map();
    }
  }

  /**
   * 加载唯一物品配置
   */
  private static LoadUniqueItemsConfig(): void {
    if (this.uniqueItemIds && this.uniqueRanges) {
      return;
    }

    try {
      const config = GameConfig.GetUniqueItemsConfig();
      if (!config) {
        Logger.Warn('[ItemSystem] 唯一物品配置未加载，使用默认规则');
        this.uniqueItemIds = new Set();
        this.uniqueRanges = [];
        return;
      }

      // 加载唯一物品ID列表
      this.uniqueItemIds = new Set(config.uniqueItemIds || []);

      // 加载唯一物品范围
      this.uniqueRanges = [];
      if (config.uniqueRanges) {
        for (const range of config.uniqueRanges) {
          this.uniqueRanges.push({
            start: range.start,
            end: range.end
          });
        }
      }

      Logger.Info(`[ItemSystem] 加载唯一物品配置完成: ${this.uniqueItemIds.size} 个唯一物品ID, ${this.uniqueRanges.length} 个范围`);
    } catch (error) {
      Logger.Error('[ItemSystem] 加载唯一物品配置失败', error as Error);
      this.uniqueItemIds = new Set();
      this.uniqueRanges = [];
    }
  }

  // ==================== 物品查询 ====================

  /**
   * 获取物品信息
   * 
   * @param itemId 物品ID
   * @returns 物品信息，不存在返回null
   */
  public static GetItem(itemId: number): IItemInfo | null {
    this.LoadItemData();
    return this.itemCache?.get(itemId) || null;
  }

  /**
   * 检查物品是否存在
   * 
   * @param itemId 物品ID
   * @returns 是否存在
   */
  public static Exists(itemId: number): boolean {
    this.LoadItemData();
    return this.itemCache?.has(itemId) || false;
  }

  /**
   * 获取物品名称
   * 
   * @param itemId 物品ID
   * @returns 物品名称
   */
  public static GetName(itemId: number): string {
    const item = this.GetItem(itemId);
    return item?.Name || `Item${itemId}`;
  }

  /**
   * 获取物品价格
   * 
   * @param itemId 物品ID
   * @returns 价格
   */
  public static GetPrice(itemId: number): number {
    const item = this.GetItem(itemId);
    return item?.Price || 0;
  }

  /**
   * 获取物品出售价格
   * 
   * @param itemId 物品ID
   * @returns 出售价格
   */
  public static GetSellPrice(itemId: number): number {
    const item = this.GetItem(itemId);
    return item?.SellPrice || 0;
  }

  /**
   * 获取物品最大堆叠数量
   * 
   * @param itemId 物品ID
   * @returns 最大堆叠数量（0或未设置表示99999）
   */
  public static GetMaxStack(itemId: number): number {
    const item = this.GetItem(itemId);
    if (!item) {
      return 99999;
    }

    // 如果 max 为 0 或 undefined，返回默认值 99999
    if (!item.Max || item.Max === 0) {
      return 99999;
    }

    return item.Max;
  }

  /**
   * 获取物品分类ID
   * 
   * @param itemId 物品ID
   * @returns 分类ID
   */
  public static GetCategoryId(itemId: number): number {
    const item = this.GetItem(itemId);
    return item?.catId || 0;
  }

  // ==================== 分类查询 ====================

  /**
   * 获取指定分类的所有物品ID
   * 
   * @param catId 分类ID
   * @returns 物品ID数组
   */
  public static GetItemsByCategory(catId: number): number[] {
    this.LoadItemData();
    return this.categoryCache?.get(catId) || [];
  }

  /**
   * 获取所有物品ID
   * 
   * @returns 物品ID数组
   */
  public static GetAllItemIds(): number[] {
    this.LoadItemData();
    return Array.from(this.itemCache?.keys() || []);
  }

  /**
   * 获取所有分类ID
   * 
   * @returns 分类ID数组
   */
  public static GetAllCategoryIds(): number[] {
    this.LoadItemData();
    return Array.from(this.categoryCache?.keys() || []);
  }

  // ==================== 物品属性判断 ====================

  /**
   * 检查物品是否为VIP专属
   * 
   * @param itemId 物品ID
   * @returns 是否VIP专属
   */
  public static IsVipOnly(itemId: number): boolean {
    const item = this.GetItem(itemId);
    return item?.isVipOnly || false;
  }

  /**
   * 检查物品是否可交易
   * 
   * @param itemId 物品ID
   * @param isVip 是否VIP（默认false）
   * @returns 是否可交易
   */
  public static IsTradable(itemId: number, isVip: boolean = false): boolean {
    const item = this.GetItem(itemId);
    if (!item) {
      return false;
    }

    const tradability = isVip ? item.vipTradability : item.tradability;
    return tradability === ItemTradability.TRADABLE || tradability === ItemTradability.FULL;
  }

  /**
   * 检查物品是否可出售
   * 
   * @param itemId 物品ID
   * @param isVip 是否VIP（默认false）
   * @returns 是否可出售
   */
  public static IsSellable(itemId: number, isVip: boolean = false): boolean {
    const item = this.GetItem(itemId);
    if (!item) {
      return false;
    }

    const tradability = isVip ? item.vipTradability : item.tradability;
    return tradability === ItemTradability.SELLABLE || tradability === ItemTradability.FULL;
  }

  /**
   * 检查物品是否为服装
   * 
   * @param itemId 物品ID
   * @returns 是否为服装
   */
  public static IsCloth(itemId: number): boolean {
    const catId = this.GetCategoryId(itemId);
    return catId >= ItemCategory.CLOTH_HEAD && catId <= ItemCategory.CLOTH_BACK;
  }

  /**
   * 检查物品是否为装备
   * 
   * @param itemId 物品ID
   * @returns 是否为装备
   */
  public static IsEquipment(itemId: number): boolean {
    const catId = this.GetCategoryId(itemId);
    return catId === ItemCategory.EQUIPMENT;
  }

  /**
   * 检查物品是否为药品
   * 
   * @param itemId 物品ID
   * @returns 是否为药品
   */
  public static IsMedicine(itemId: number): boolean {
    const catId = this.GetCategoryId(itemId);
    return catId === ItemCategory.MEDICINE;
  }

  /**
   * 检查物品是否为捕捉道具
   * 
   * @param itemId 物品ID
   * @returns 是否为捕捉道具
   */
  public static IsCaptureItem(itemId: number): boolean {
    const catId = this.GetCategoryId(itemId);
    return catId === ItemCategory.CAPTURE;
  }

  // ==================== 装备属性 ====================

  /**
   * 获取装备的属性加成
   * 
   * @param itemId 物品ID
   * @returns 属性加成对象
   */
  public static GetEquipmentStats(itemId: number): {
    hp: number;
    atk: number;
    def: number;
  } {
    const item = this.GetItem(itemId);
    if (!item) {
      return { hp: 0, atk: 0, def: 0 };
    }

    return {
      hp: item.PkHp || 0,
      atk: item.PkAtk || 0,
      def: item.PkDef || 0
    };
  }

  // ==================== 物品使用 ====================

  /**
   * 检查物品是否可使用
   * 
   * @param itemId 物品ID
   * @returns 是否可使用
   */
  public static IsUsable(itemId: number): boolean {
    const item = this.GetItem(itemId);
    if (!item) {
      return false;
    }

    // 药品和捕捉道具可使用
    return this.IsMedicine(itemId) || this.IsCaptureItem(itemId);
  }

  /**
   * 获取物品的功能ID
   * 
   * @param itemId 物品ID
   * @returns 功能ID
   */
  public static GetFunctionId(itemId: number): number {
    const item = this.GetItem(itemId);
    // Fun 字段可能不存在，返回0
    return (item as any)?.Fun || 0;
  }

  // ==================== 统计信息 ====================

  /**
   * 获取物品系统统计信息
   * 
   * @returns 统计信息
   */
  public static GetStats(): {
    totalItems: number;
    totalCategories: number;
    vipOnlyItems: number;
    tradableItems: number;
  } {
    this.LoadItemData();

    let vipOnlyCount = 0;
    let tradableCount = 0;

    for (const item of this.itemCache?.values() || []) {
      if (item.isVipOnly) {
        vipOnlyCount++;
      }
      if (item.tradability === ItemTradability.TRADABLE || item.tradability === ItemTradability.FULL) {
        tradableCount++;
      }
    }

    return {
      totalItems: this.itemCache?.size || 0,
      totalCategories: this.categoryCache?.size || 0,
      vipOnlyItems: vipOnlyCount,
      tradableItems: tradableCount
    };
  }

  /**
   * 打印物品系统信息（调试用）
   */
  public static PrintStats(): void {
    const stats = this.GetStats();
    Logger.Info('========== 物品系统统计 ==========');
    Logger.Info(`总物品数: ${stats.totalItems}`);
    Logger.Info(`总分类数: ${stats.totalCategories}`);
    Logger.Info(`VIP专属物品: ${stats.vipOnlyItems}`);
    Logger.Info(`可交易物品: ${stats.tradableItems}`);
    Logger.Info('====================================');
  }

  // ==================== 物品ID范围判断 ====================

  /**
   * 根据物品ID判断物品类型（快速判断）
   * 
   * 常见ID范围：
   * - 100001-191001: 服装
   * - 300001-399999: 药品
   * - 400001-499999: 捕捉道具
   * 
   * @param itemId 物品ID
   * @returns 物品类型描述
   */
  public static GetItemTypeByIdRange(itemId: number): string {
    if (itemId >= 100001 && itemId <= 191001) {
      return '服装';
    } else if (itemId >= 300001 && itemId <= 399999) {
      return '药品';
    } else if (itemId >= 400001 && itemId <= 499999) {
      return '捕捉道具';
    } else if (itemId >= 500001 && itemId <= 599999) {
      return '装备';
    } else {
      return '其他';
    }
  }

  /**
   * 检查物品是否为唯一物品（不可重复拥有）
   * 
   * 从配置文件读取唯一物品列表和范围
   * 
   * @param itemId 物品ID
   * @returns 是否唯一
   */
  public static IsUniqueItem(itemId: number): boolean {
    this.LoadUniqueItemsConfig();

    // 检查是否在唯一物品ID列表中
    if (this.uniqueItemIds?.has(itemId)) {
      return true;
    }

    // 检查是否在唯一物品范围内
    if (this.uniqueRanges) {
      for (const range of this.uniqueRanges) {
        if (itemId >= range.start && itemId <= range.end) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 添加唯一物品ID（运行时动态添加）
   * 
   * @param itemId 物品ID
   */
  public static AddUniqueItem(itemId: number): void {
    this.LoadUniqueItemsConfig();
    this.uniqueItemIds?.add(itemId);
    Logger.Info(`[ItemSystem] 添加唯一物品: ${itemId}`);
  }

  /**
   * 移除唯一物品ID（运行时动态移除）
   * 
   * @param itemId 物品ID
   */
  public static RemoveUniqueItem(itemId: number): void {
    this.LoadUniqueItemsConfig();
    this.uniqueItemIds?.delete(itemId);
    Logger.Info(`[ItemSystem] 移除唯一物品: ${itemId}`);
  }

  /**
   * 添加唯一物品范围（运行时动态添加）
   * 
   * @param start 起始ID
   * @param end 结束ID
   */
  public static AddUniqueRange(start: number, end: number): void {
    this.LoadUniqueItemsConfig();
    this.uniqueRanges?.push({ start, end });
    Logger.Info(`[ItemSystem] 添加唯一物品范围: ${start}-${end}`);
  }

  /**
   * 获取所有唯一物品ID
   * 
   * @returns 唯一物品ID数组
   */
  public static GetAllUniqueItemIds(): number[] {
    this.LoadUniqueItemsConfig();
    return Array.from(this.uniqueItemIds || []);
  }

  /**
   * 获取所有唯一物品范围
   * 
   * @returns 唯一物品范围数组
   */
  public static GetAllUniqueRanges(): Array<{ start: number; end: number }> {
    this.LoadUniqueItemsConfig();
    return [...(this.uniqueRanges || [])];
  }
}
