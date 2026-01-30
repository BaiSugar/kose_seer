/**
 * 数据保存器
 * 负责将内存数据保存到数据库
 */

import { DatabaseManager } from '../DatabaseManager';
import { DataCache } from '../cache/DataCache';
import { DataConfigRegistry } from '../config/DataConfig';
import { Logger } from '../../shared/utils';

/**
 * 数据保存器
 */
export class DataSaver {
  private static _instance: DataSaver;

  /** 待保存的 UID 列表 */
  public static ToSaveUidList: Set<number> = new Set();

  private constructor() {}

  public static get Instance(): DataSaver {
    if (!DataSaver._instance) {
      DataSaver._instance = new DataSaver();
    }
    return DataSaver._instance;
  }

  /**
   * 保存单个数据
   */
  public async Save<T>(type: string, data: T): Promise<void> {
    const config = DataConfigRegistry.Instance.GetConfig<T>(type);

    try {
      const row = config.toRow(data);
      const uid = config.getUid(data);

      // 调试日志
      //Logger.Debug(`[DataSaver] 准备保存 ${type}Data: uid=${uid}, row=${JSON.stringify(row)}`);

      // 检查 uid 是否有效
      if (!uid || uid === 0) {
        Logger.Error(`[DataSaver] Invalid uid for ${type}Data: uid=${uid}`);
        throw new Error(`Invalid uid: ${uid}`);
      }

      // 检查是否存在
      const exists = await DatabaseManager.Instance.Query<any>(
        `SELECT owner_id FROM ${config.tableName} WHERE owner_id = ? LIMIT 1`,
        [uid]
      );

      //Logger.Debug(`[DataSaver] 检查结果: ${type}Data, uid=${uid}, exists=${exists.length > 0}`);

      if (exists.length > 0) {
        // 更新
        if (config.saveFields) {
          const setClause = config.saveFields.map(f => `${f} = ?`).join(', ');
          const values = config.saveFields.map(f => row[f]);
          values.push(uid);

          const sql = `UPDATE ${config.tableName} SET ${setClause} WHERE owner_id = ?`;
         // Logger.Debug(`[DataSaver] 执行 UPDATE: ${sql}`);
         // Logger.Debug(`[DataSaver] 参数: ${JSON.stringify(values.map((v, i) => i === values.length - 1 ? v : (typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v)))}`);

          const result = await DatabaseManager.Instance.Execute(sql, values);
          //Logger.Debug(`[DataSaver] UPDATE 结果: ${JSON.stringify(result)}`);
        }
      } else {
        // 插入
        if (config.saveFields) {
          const fields = ['owner_id', ...config.saveFields];
          const placeholders = fields.map(() => '?').join(', ');
          const values = [uid, ...config.saveFields.map(f => row[f])];

          await DatabaseManager.Instance.Execute(
            `INSERT INTO ${config.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
      }

      //Logger.Debug(`[DataSaver] ${type}Data 已保存: uid=${uid}`);
    } catch (error) {
      Logger.Error(`[DataSaver] 保存 ${type}Data 失败`, error as Error);
    }
  }

  /**
   * 批量保存所有待保存的数据
   */
  public async SaveAll(): Promise<void> {
    if (DataSaver.ToSaveUidList.size === 0) return;

    const uids = Array.from(DataSaver.ToSaveUidList);
    DataSaver.ToSaveUidList.clear();

   // Logger.Debug(`[DataSaver] 开始保存数据: ${uids.length} 个玩家`);

    const dataTypes = DataConfigRegistry.Instance.GetAllTypes();
    const cache = DataCache.Instance;

    for (const uid of uids) {
      for (const type of dataTypes) {
        const data = cache.Get(type, uid);
        if (data) {
          await this.Save(type, data);
          
          // 清理定时器（如果有 cleanup 方法）
          if (typeof (data as any).cleanup === 'function') {
            (data as any).cleanup();
          }
        }
      }
    }

    Logger.Debug(`[DataSaver] 数据保存完成`);
  }

  /**
   * 保存指定用户的所有数据
   */
  public async SaveUser(uid: number): Promise<void> {
    const dataTypes = DataConfigRegistry.Instance.GetAllTypes();
    const cache = DataCache.Instance;

    for (const type of dataTypes) {
      const data = cache.Get(type, uid);
      if (data) {
        await this.Save(type, data);
        
        // 清理定时器（如果有 cleanup 方法）
        if (typeof (data as any).cleanup === 'function') {
          (data as any).cleanup();
        }
      }
    }

    Logger.Debug(`[DataSaver] 用户数据已保存: uid=${uid}`);
  }
}
