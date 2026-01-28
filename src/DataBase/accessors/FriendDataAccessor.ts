/**
 * FriendData 访问器
 * 提供 FriendData 的便捷访问接口
 */

import { FriendData } from '../models/FriendData';
import { DataLoader } from '../loaders/DataLoader';
import { DataSaver } from '../savers/DataSaver';

/**
 * FriendData 访问器
 */
export class FriendDataAccessor {
  private static _instance: FriendDataAccessor;

  private constructor() {}

  public static get Instance(): FriendDataAccessor {
    if (!FriendDataAccessor._instance) {
      FriendDataAccessor._instance = new FriendDataAccessor();
    }
    return FriendDataAccessor._instance;
  }

  /**
   * 获取或创建 FriendData
   */
  public async GetOrCreate(uid: number): Promise<FriendData> {
    return DataLoader.Instance.GetOrCreate<FriendData>('friend', uid);
  }

  /**
   * 获取 FriendData（不创建）
   */
  public Get(uid: number): FriendData | null {
    return DataLoader.Instance.Get<FriendData>('friend', uid);
  }

  /**
   * 保存 FriendData
   */
  public async Save(data: FriendData): Promise<void> {
    return DataSaver.Instance.Save('friend', data);
  }
}
