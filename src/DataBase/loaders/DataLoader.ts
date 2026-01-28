/**
 * 数据加载器
 * 负责从数据库加载数据到内存
 */

import { DatabaseManager } from '../DatabaseManager';
import { DataCache } from '../cache/DataCache';
import { DataConfigRegistry } from '../config/DataConfig';
import { Logger } from '../../shared/utils';

/**
 * 数据加载器
 */
export class DataLoader {
  private static _instance: DataLoader;

  private constructor() {}

  public static get Instance(): DataLoader {
    if (!DataLoader._instance) {
      DataLoader._instance = new DataLoader();
    }
    return DataLoader._instance;
  }

  /**
   * 获取或创建数据实例
   */
  public async GetOrCreate<T>(type: string, uid: number): Promise<T> {
    const cache = DataCache.Instance;
    
    // 先从缓存获取
    if (cache.Has(type, uid)) {
      return cache.Get<T>(type, uid)!;
    }

    const config = DataConfigRegistry.Instance.GetConfig<T>(type);

    // 从数据库加载
    try {
      const rows = await DatabaseManager.Instance.Query<any>(
        `SELECT * FROM ${config.tableName} WHERE owner_id = ? LIMIT 1`,
        [uid]
      );

      let data: T;
      if (rows.length > 0) {
        data = config.dataClass.FromRow(rows[0]);
      } else {
        // 创建新数据
        data = new config.dataClass(uid);
        // 新数据需要立即保存
        await this._saveNew(type, data);
      }

      // 缓存
      cache.Set(type, uid, data);
      return data;
    } catch (error) {
      Logger.Error(`[DataLoader] 加载 ${type}Data 失败: uid=${uid}`, error as Error);
      // 出错时创建空数据并缓存
      const data = new config.dataClass(uid);
      cache.Set(type, uid, data);
      return data;
    }
  }

  /**
   * 获取数据实例（不创建新的）
   */
  public Get<T>(type: string, uid: number): T | null {
    return DataCache.Instance.Get<T>(type, uid);
  }

  /**
   * 保存新创建的数据
   */
  private async _saveNew<T>(type: string, data: T): Promise<void> {
    const config = DataConfigRegistry.Instance.GetConfig<T>(type);
    const row = config.toRow(data);
    const uid = config.getUid(data);

    Logger.Debug(`[DataLoader] 准备新建 ${type}Data: uid=${uid}`);

    try {
      if (config.saveFields) {
        const fields = ['owner_id', ...config.saveFields];
        const placeholders = fields.map(() => '?').join(', ');
        const values = [uid, ...config.saveFields.map(f => row[f])];

        Logger.Debug(`[DataLoader] INSERT SQL: INSERT INTO ${config.tableName} (${fields.join(', ')}) VALUES (${placeholders}), values=${JSON.stringify(values)}`);

        await DatabaseManager.Instance.Execute(
          `INSERT INTO ${config.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
      Logger.Info(`[DataLoader] 新建 ${type}Data 成功: uid=${uid}`);
    } catch (error) {
      Logger.Error(`[DataLoader] 保存新 ${type}Data 失败: uid=${uid}`, error as Error);
      throw error;  // 重新抛出错误，让调用者知道失败了
    }
  }
}
