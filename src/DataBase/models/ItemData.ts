/**
 * 物品数据类
 * 直接映射数据库表，提供静态方法便捷访问
 * 
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */

import { DatabaseHelper } from '../DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { BaseData } from './BaseData';

/**
 * 单个物品信息
 */
export interface IItemInfo {
  itemId: number;
  count: number;
  expireTime: number;
}

/**
 * 物品数据（对应数据库表 items）
 * 
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetItemDataByUid 便捷访问
 */
export class ItemData extends BaseData {
  /** 用户ID（主键） */
  public Uid: number;

  /** 物品列表 */
  public ItemList: IItemInfo[] = [];

  constructor(uid: number) {
    if (!uid || uid === 0) {
      throw new Error(`[ItemData] Invalid uid: ${uid}`);
    }
    
    // 调用父类构造函数，传入黑名单字段和数组字段
    super(
      uid,
      [], // 额外的黑名单字段
      ['ItemList'] // 需要深度 Proxy 的数组字段
    );
    
    this.Uid = uid;

    // 返回 Proxy 包装的对象，实现自动保存
    return this.createProxy(this);
  }
  /**
   * 立即保存到数据库
   */
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveItemData(this);
      Logger.Debug(`[ItemData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[ItemData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  /**
   * 从数据库行创建 ItemData
   */
  public static FromRow(row: any): ItemData {
    const data = new ItemData(row.owner_id);
    data.ItemList = row.item_list ? JSON.parse(row.item_list) : [];
    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    return {
      owner_id: this.Uid,
      item_list: JSON.stringify(this.ItemList)
    };
  }

  /**
   * 静态方法：根据 UID 获取物品数据
   */
  public static async GetItemDataByUid(uid: number): Promise<ItemData | null> {
    const data = await DatabaseHelper.Instance.GetInstance_ItemData(uid);
    return data;
  }

  /**
   * 添加物品
   */
  public AddItem(itemId: number, count: number, expireTime: number = 0): void {
    const existing = this.ItemList.find(item => item.itemId === itemId);
    if (existing) {
      existing.count += count;
    } else {
      this.ItemList.push({ itemId, count, expireTime });
    }
    // 自动触发保存（通过深度 Proxy）
  }

  /**
   * 移除物品
   */
  public RemoveItem(itemId: number, count: number): boolean {
    const existing = this.ItemList.find(item => item.itemId === itemId);
    if (!existing || existing.count < count) {
      return false;
    }
    
    existing.count -= count;
    if (existing.count <= 0) {
      this.ItemList = this.ItemList.filter(item => item.itemId !== itemId);
    }
    
    // 自动触发保存（通过深度 Proxy）
    return true;
  }

  /**
   * 检查是否拥有物品
   */
  public HasItem(itemId: number): boolean {
    return this.ItemList.some(item => item.itemId === itemId && item.count > 0);
  }

  /**
   * 获取物品数量
   */
  public GetItemCount(itemId: number): number {
    const item = this.ItemList.find(item => item.itemId === itemId);
    return item ? item.count : 0;
  }
}
