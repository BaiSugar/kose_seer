import { DatabaseManager } from '../DatabaseManager';
import { ChallengeProgressData } from '../models/ChallengeProgressData';
import { Logger } from '../../shared/utils/Logger';

/**
 * 挑战进度数据访问器
 * 负责挑战进度数据的数据库操作和缓存管理
 */
export class ChallengeProgressDataAccessor {
  private static _instance: ChallengeProgressDataAccessor;
  private _cache: Map<number, ChallengeProgressData> = new Map();

  private constructor() {}

  public static get Instance(): ChallengeProgressDataAccessor {
    if (!ChallengeProgressDataAccessor._instance) {
      ChallengeProgressDataAccessor._instance = new ChallengeProgressDataAccessor();
    }
    return ChallengeProgressDataAccessor._instance;
  }

  /**
   * 获取或创建挑战进度数据
   */
  public async GetOrCreate(uid: number): Promise<ChallengeProgressData> {
    // 1. 检查缓存
    if (this._cache.has(uid)) {
      return this._cache.get(uid)!;
    }

    // 2. 从数据库加载
    const data = await this.Load(uid);

    // 3. 缓存
    this._cache.set(uid, data);

    return data;
  }

  /**
   * 从数据库加载挑战进度数据
   */
  public async Load(uid: number): Promise<ChallengeProgressData> {
    try {
      const rows = await DatabaseManager.Instance.Query<any>(
        'SELECT * FROM player_challenge_progress WHERE user_id = ?',
        [uid]
      );

      if (rows && rows.length > 0) {
        Logger.Debug(`[ChallengeProgressDataAccessor] 加载挑战进度数据: uid=${uid}`);
        return ChallengeProgressData.FromRow(rows[0]);
      } else {
        // 不存在则创建默认数据
        Logger.Debug(`[ChallengeProgressDataAccessor] 创建默认挑战进度数据: uid=${uid}`);
        const data = ChallengeProgressData.CreateDefault(uid);
        await this.Save(data);
        return data;
      }
    } catch (error) {
      Logger.Error(`[ChallengeProgressDataAccessor] 加载挑战进度数据失败: uid=${uid}`, error as Error);
      // 返回默认数据
      return ChallengeProgressData.CreateDefault(uid);
    }
  }

  /**
   * 保存挑战进度数据到数据库
   */
  public async Save(data: ChallengeProgressData): Promise<void> {
    try {
      const row = data.ToRow();

      // 兼容 MySQL / SQLite 的 Upsert
      const dbType = DatabaseManager.Instance.DatabaseType;
      if (dbType === 'sqlite') {
        await DatabaseManager.Instance.Execute(
          `INSERT INTO player_challenge_progress (user_id, boss_achievement, max_puni_lv, tower_boss_index)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             boss_achievement = excluded.boss_achievement,
             max_puni_lv = excluded.max_puni_lv,
             tower_boss_index = excluded.tower_boss_index`,
          [row.user_id, row.boss_achievement, row.max_puni_lv, row.tower_boss_index]
        );
      } else {
        await DatabaseManager.Instance.Execute(
          `INSERT INTO player_challenge_progress 
           (user_id, boss_achievement, max_puni_lv, tower_boss_index) 
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           boss_achievement = VALUES(boss_achievement),
           max_puni_lv = VALUES(max_puni_lv),
           tower_boss_index = VALUES(tower_boss_index)`,
          [row.user_id, row.boss_achievement, row.max_puni_lv, row.tower_boss_index]
        );
      }

      Logger.Debug(`[ChallengeProgressDataAccessor] 保存挑战进度数据成功: uid=${data.userID}`);
    } catch (error) {
      Logger.Error(`[ChallengeProgressDataAccessor] 保存挑战进度数据失败: uid=${data.userID}`, error as Error);
      throw error;
    }
  }

  /**
   * 获取缓存的数据（不触发数据库查询）
   */
  public GetCached(uid: number): ChallengeProgressData | undefined {
    return this._cache.get(uid);
  }

  /**
   * 移除缓存
   */
  public RemoveCache(uid: number): void {
    this._cache.delete(uid);
    Logger.Debug(`[ChallengeProgressDataAccessor] 移除缓存: uid=${uid}`);
  }

  /**
   * 清空所有缓存
   */
  public ClearAllCache(): void {
    this._cache.clear();
    Logger.Info(`[ChallengeProgressDataAccessor] 清空所有缓存`);
  }

  /**
   * 获取缓存统计信息
   */
  public GetCacheStats(): { size: number } {
    return {
      size: this._cache.size
    };
  }
}
