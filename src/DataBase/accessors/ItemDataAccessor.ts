/**
 * ItemData 访问器
 * 提供 ItemData 的便捷访问接口
 */

import { ItemData } from '../models/ItemData';
import { DataLoader } from '../loaders/DataLoader';
import { DataSaver } from '../savers/DataSaver';

/**
 * ItemData 访问器
 */
export class ItemDataAccessor {
  private static _instance: ItemDataAccessor;

  private constructor() {}

  public static get Instance(): ItemDataAccessor {
    if (!ItemDataAccessor._instance) {
      ItemDataAccessor._instance = new ItemDataAccessor();
    }
    return ItemDataAccessor._instance;
  }

  /**
   * 获取或创建 ItemData
   */
  public async GetOrCreate(uid: number): Promise<ItemData> {
    return DataLoader.Instance.GetOrCreate<ItemData>('item', uid);
  }

  /**
   * 获取 ItemData（不创建）
   */
  public Get(uid: number): ItemData | null {
    return DataLoader.Instance.Get<ItemData>('item', uid);
  }

  /**
   * 保存 ItemData
   */
  public async Save(data: ItemData): Promise<void> {
    return DataSaver.Instance.Save('item', data);
  }
}
