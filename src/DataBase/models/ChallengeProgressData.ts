import { BaseData } from './BaseData';
import { DatabaseHelper } from '../DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';

/**
 * 挑战进度数据接口
 */
export interface IChallengeProgressInfo {
  userID: number;
  bossAchievement: boolean[];  // 200 个布尔值
  maxPuniLv: number;           // 0-8
  towerBossIndex: number;      // 0-2
}

/**
 * 挑战进度数据类
 * 
 * 存储玩家的各种挑战进度：
 * - SPT BOSS 击败记录（bossAchievement）
 * - 谱尼封印进度（maxPuniLv）
 * - 勇者之塔进度（towerBossIndex）
 * 
 * 优化：
 * - 使用独立表存储，减少主表查询负担
 * - bossAchievement 使用 BLOB 存储，减少 JSON 序列化开销
 */
export class ChallengeProgressData extends BaseData {
  public userID: number;
  public bossAchievement: boolean[];
  public maxPuniLv: number;
  public towerBossIndex: number;

  constructor(userID: number) {
    super(
      userID,
      [], // 没有额外的黑名单字段
      ['bossAchievement'] // 数组字段需要深度 Proxy
    );

    this.userID = userID;
    this.bossAchievement = new Array(200).fill(false);
    this.maxPuniLv = 0;
    this.towerBossIndex = 0;

    return this.createProxy(this);
  }

  /**
   * 实现 BaseData 的 save 方法
   */
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveChallengeProgressData(this);
      Logger.Debug(`[ChallengeProgressData] 自动保存成功: userID=${this.userID}`);
    } catch (error) {
      Logger.Error(`[ChallengeProgressData] 自动保存失败: userID=${this.userID}`, error as Error);
    }
  }

  /**
   * 从数据库行创建实例
   */
  public static FromRow(row: any): ChallengeProgressData {
    const data = new ChallengeProgressData(row.user_id);

    // 解析 BLOB 数据为布尔数组
    if (row.boss_achievement) {
      const buffer = Buffer.isBuffer(row.boss_achievement) 
        ? row.boss_achievement 
        : Buffer.from(row.boss_achievement);
      
      data.bossAchievement = Array.from(buffer).map(b => b === 1);
    }

    data.maxPuniLv = row.max_puni_lv || 0;
    data.towerBossIndex = row.tower_boss_index || 0;

    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    // 将布尔数组转换为 BLOB
    const buffer = Buffer.alloc(200);
    for (let i = 0; i < 200; i++) {
      buffer[i] = this.bossAchievement[i] ? 1 : 0;
    }

    return {
      user_id: this.userID,
      boss_achievement: buffer,
      max_puni_lv: this.maxPuniLv,
      tower_boss_index: this.towerBossIndex
    };
  }

  /**
   * 创建默认实例
   */
  public static CreateDefault(userID: number): ChallengeProgressData {
    return new ChallengeProgressData(userID);
  }
}
