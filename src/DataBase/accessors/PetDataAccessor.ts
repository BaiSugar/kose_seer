/**
 * PetData 访问器
 * 提供 PetData 的便捷访问接口
 */

import { PetData } from '../models/PetData';
import { DataLoader } from '../loaders/DataLoader';
import { DataSaver } from '../savers/DataSaver';

/**
 * PetData 访问器
 */
export class PetDataAccessor {
  private static _instance: PetDataAccessor;

  private constructor() {}

  public static get Instance(): PetDataAccessor {
    if (!PetDataAccessor._instance) {
      PetDataAccessor._instance = new PetDataAccessor();
    }
    return PetDataAccessor._instance;
  }

  /**
   * 获取或创建 PetData
   */
  public async GetOrCreate(uid: number): Promise<PetData> {
    return DataLoader.Instance.GetOrCreate<PetData>('pet', uid);
  }

  /**
   * 获取 PetData（不创建）
   */
  public Get(uid: number): PetData | null {
    return DataLoader.Instance.Get<PetData>('pet', uid);
  }

  /**
   * 保存 PetData
   */
  public async Save(data: PetData): Promise<void> {
    return DataSaver.Instance.Save('pet', data);
  }
}
