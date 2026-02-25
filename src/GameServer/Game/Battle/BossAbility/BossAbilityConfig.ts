/**
 * BOSS配置加载器
 *
 * 从 boss_abilities.json 读取BOSS完整配置
 * 包含：属性、等级、掉落、特性、特殊规则等
 * 
 * 特性支持两种格式:
 *   纯数字: 1902 → 使用默认参数
 *   带参数: { "id": 1904, "args": [30] } → 覆盖默认参数
 * 
 * SPT BOSS 扩展:
 *   支持地图BOSS查询、首次击败奖励、BOSS特性判断等
 * 
 * 特殊规则:
 *   通过JSON配置驱动，避免硬编码
 */

import { Logger } from '../../../../shared/utils';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys } from '../../../../shared/config/ConfigDefinitions';

/**
 * 单个特性条目（解析后）
 */
export interface IAbilityEntry {
  id: number;
  args?: number[];
}

/**
 * SPT BOSS 配置（先锋队任务）
 */
export interface ISPTBossInfo {
  sptId: number;        // 先锋队任务 ID (1-20)
  rewardPetId?: number; // 首次击败奖励精灵 ID
  rewardItemId?: number; // 首次击败奖励物品 ID（精元等）
}

/**
 * 地图 BOSS 配置
 */
export interface IMapBossInfo {
  mapId: number;        // 地图 ID
  param2: number;       // 参数2（区域/槽位）
  bossId: number;       // BOSS ID
  hasShield?: boolean;  // 是否有防护罩
}

/**
 * 顺序破防规则（如哈莫雷特）
 */
export interface ISequentialTypeBreakRule {
  petId: number;              // 精灵ID
  petName: string;            // 精灵名称
  description: string;        // 规则描述
  typeSequence: number[];     // 属性类型序列（如 [2, 3, 1] 表示 水→火→草）
  typeNames: string[];        // 属性名称（用于日志）
}

/**
 * 特殊击杀条件规则（如尤纳斯）
 */
export interface ISpecialKillConditionRule {
  petId: number;              // 精灵ID
  petName: string;            // 精灵名称
  description: string;        // 规则描述
  breakSkillId: number;       // 破防技能ID
  breakSkillName: string;     // 破防技能名称
  killSkillId: number;        // 击杀技能ID
  killSkillName: string;      // 击杀技能名称
  requiredPetId: number;      // 必须使用的精灵ID
  requiredPetName: string;    // 必须使用的精灵名称
}

/**
 * 周几出现规则（如盖亚）
 */
export interface IWeekdayScheduleRule {
  petId: number;              // 精灵ID
  petName: string;            // 精灵名称
  description: string;        // 规则描述
  schedule: Array<{
    weekdays: number[];       // 周几（0=周日, 1=周一, ..., 6=周六）
    mapId: number;            // 地图ID
    mapName: string;          // 地图名称
    condition: string;        // 挑战条件类型（criticalHit/withinRounds/afterRounds）
    conditionValue?: number;  // 条件值（回合数等）
    conditionDesc: string;    // 条件描述
  }>;
}

/**
 * 特殊规则配置
 */
export interface ISpecialRules {
  sequentialTypeBreak?: ISequentialTypeBreakRule[];      // 顺序破防规则（数组，支持多个BOSS）
  specialKillCondition?: ISpecialKillConditionRule[];    // 特殊击杀条件规则（数组，支持多个BOSS）
  weekdaySchedule?: IWeekdayScheduleRule[];              // 周几出现规则（数组，支持多个BOSS）
}

/**
 * BOSS完整配置接口（JSON原始格式）
 */
export interface IBossConfig {
  mapId: number;      // 地图ID
  param2: number;     // 参数2（区域/槽位）
  petId: number;
  petName: string;
  level: number;
  dv: number;
  ev: number;
  nature: number;
  customHP?: number;  // 自定义血量（可选）
  skills?: number[];  // 固定技能列表（可选，优先级高于按等级可学技能）
  abilities: (number | { id: number; args?: number[] })[];
  drops: Array<{ itemId: number; rate: number; count: number }>;
  rewards: { exp: number; coins: number };
  description: string;
  // SPT 扩展字段
  spt?: ISPTBossInfo;
}

/**
 * BOSS配置文件接口
 */
interface IBossConfigFile {
  version: string;
  description: string;
  lastUpdate: string;
  mapAlias?: Record<string, number>;      // 地图别名配置
  specialRules?: ISpecialRules;           // 特殊规则配置
  bossConfigs: IBossConfig[];
  abilityReference?: any;
  dropItemReference?: any;
  notes?: string[];
}

/**
 * BOSS配置类
 */
export class BossAbilityConfig {
  private static _instance: BossAbilityConfig;
  private abilityMap: Map<number, IAbilityEntry[]> = new Map(); // petId -> abilities
  private bossConfigMap: Map<number, Map<number, IBossConfig>> = new Map(); // mapId -> (param2 -> config)
  private petIdToConfigs: Map<number, IBossConfig[]> = new Map(); // petId -> configs[] (用于快速查询)
  private sptIdToConfig: Map<number, IBossConfig> = new Map(); // sptId -> config (用于快速查询)
  private loaded: boolean = false;

  // 从配置文件加载的数据
  private mapAlias: Map<number, number> = new Map(); // 地图别名
  private specialRules: ISpecialRules = {}; // 特殊规则
  
  // 特殊规则快速查询索引
  private sequentialTypeBreakIndex: Map<number, ISequentialTypeBreakRule> = new Map(); // petId -> rule
  private specialKillConditionIndex: Map<number, ISpecialKillConditionRule> = new Map(); // petId -> rule
  private weekdayScheduleIndex: Map<number, IWeekdayScheduleRule> = new Map(); // petId -> rule

  private constructor() {}

  public static get Instance(): BossAbilityConfig {
    if (!BossAbilityConfig._instance) {
      BossAbilityConfig._instance = new BossAbilityConfig();
    }
    return BossAbilityConfig._instance;
  }

  /**
   * 加载配置文件
   */
  public Load(): void {
    if (this.loaded) {
      return;
    }

    try {
      // 使用ConfigRegistry加载配置
      const config = ConfigRegistry.Instance.Get<IBossConfigFile>(ConfigKeys.BOSS_ABILITIES);

      if (!config) {
        Logger.Warn(`[BossAbilityConfig] 配置未加载或不存在: ${ConfigKeys.BOSS_ABILITIES}`);
        this.loaded = true;
        return;
      }

      // 加载地图别名
      this.mapAlias.clear();
      if (config.mapAlias) {
        for (const [key, value] of Object.entries(config.mapAlias)) {
          this.mapAlias.set(parseInt(key), value);
        }
        Logger.Info(`[BossAbilityConfig] 加载地图别名: ${this.mapAlias.size}个`);
      }

      // 加载特殊规则并构建索引
      this.sequentialTypeBreakIndex.clear();
      this.specialKillConditionIndex.clear();
      this.weekdayScheduleIndex.clear();
      
      if (config.specialRules) {
        this.specialRules = config.specialRules;
        
        // 构建顺序破防规则索引
        if (config.specialRules.sequentialTypeBreak) {
          for (const rule of config.specialRules.sequentialTypeBreak) {
            this.sequentialTypeBreakIndex.set(rule.petId, rule);
          }
        }
        
        // 构建特殊击杀条件规则索引
        if (config.specialRules.specialKillCondition) {
          for (const rule of config.specialRules.specialKillCondition) {
            this.specialKillConditionIndex.set(rule.petId, rule);
          }
        }
        
        // 构建周几出现规则索引
        if (config.specialRules.weekdaySchedule) {
          for (const rule of config.specialRules.weekdaySchedule) {
            this.weekdayScheduleIndex.set(rule.petId, rule);
          }
        }
        
        const ruleCount = 
          (config.specialRules.sequentialTypeBreak?.length || 0) +
          (config.specialRules.specialKillCondition?.length || 0) +
          (config.specialRules.weekdaySchedule?.length || 0);
        Logger.Info(`[BossAbilityConfig] 加载特殊规则: ${ruleCount}个`);
      }

      // 构建映射表
      this.abilityMap.clear();
      this.bossConfigMap.clear();
      this.petIdToConfigs.clear();
      this.sptIdToConfig.clear();
      
      for (const boss of config.bossConfigs) {
        // 解析特性列表
        const entries: IAbilityEntry[] = [];
        for (const ability of boss.abilities) {
          if (typeof ability === 'number') {
            entries.push({ id: ability });
          } else {
            entries.push({ id: ability.id, args: ability.args });
          }
        }
        
        // 存储特性映射（按petId索引，向后兼容）
        this.abilityMap.set(boss.petId, entries);
        
        // 构建二级索引：mapId -> (param2 -> config)
        if (!this.bossConfigMap.has(boss.mapId)) {
          this.bossConfigMap.set(boss.mapId, new Map());
        }
        this.bossConfigMap.get(boss.mapId)!.set(boss.param2, boss);

        // 构建petId索引（一个petId可能对应多个BOSS配置）
        if (!this.petIdToConfigs.has(boss.petId)) {
          this.petIdToConfigs.set(boss.petId, []);
        }
        this.petIdToConfigs.get(boss.petId)!.push(boss);

        // 构建SPT索引
        if (boss.spt && boss.spt.sptId > 0) {
          this.sptIdToConfig.set(boss.spt.sptId, boss);
        }
      }

      Logger.Info(
        `[BossAbilityConfig] 加载BOSS配置成功: ` +
        `版本=${config.version}, BOSS数=${config.bossConfigs.length}, ` +
        `地图数=${this.bossConfigMap.size}, 地图别名=${this.mapAlias.size}, ` +
        `特殊规则索引=${this.sequentialTypeBreakIndex.size + this.specialKillConditionIndex.size + this.weekdayScheduleIndex.size}`
      );

      this.loaded = true;
    } catch (error) {
      Logger.Error('[BossAbilityConfig] 加载配置文件失败', error as Error);
      this.loaded = true;
    }
  }

  /**
   * 根据地图ID和param2获取BOSS配置（主要查询方法）
   * 支持地图别名（如任务副本地图912 -> 正式地图40）
   * 
   * @param mapId 地图ID
   * @param param2 参数2（区域/槽位）
   * @returns BOSS配置对象，如果不存在返回undefined
   */
  public GetBossConfigByMapAndParam(mapId: number, param2: number): IBossConfig | undefined {
    if (!this.loaded) {
      this.Load();
    }

    // 检查地图别名（如任务副本地图912 -> 正式地图40）
    const actualMapId = this.mapAlias.get(mapId) || mapId;

    // 查询BOSS配置
    const paramMap = this.bossConfigMap.get(actualMapId);
    if (!paramMap) {
      return undefined;
    }

    return paramMap.get(param2);
  }

  /**
   * 根据petId获取BOSS配置列表（一个petId可能对应多个BOSS）
   * @param petId 精灵ID
   * @returns BOSS配置数组，如果不存在返回空数组
   */
  public GetBossConfigsByPetId(petId: number): IBossConfig[] {
    if (!this.loaded) {
      this.Load();
    }

    return this.petIdToConfigs.get(petId) || [];
  }

  /**
   * 根据petId获取第一个BOSS配置（向后兼容）
   * @param petId 精灵ID
   * @returns BOSS配置对象，如果不存在返回undefined
   */
  public GetBossConfigByPetId(petId: number): IBossConfig | undefined {
    const configs = this.GetBossConfigsByPetId(petId);
    return configs.length > 0 ? configs[0] : undefined;
  }

  /**
   * 获取精灵的特性条目列表（包含参数）
   *
   * @param petId 精灵ID
   * @returns 特性条目数组
   */
  public GetAbilityEntries(petId: number): IAbilityEntry[] {
    if (!this.loaded) {
      this.Load();
    }

    return this.abilityMap.get(petId) || [];
  }

  /**
   * 获取精灵的特性ID列表（向后兼容）
   *
   * @param petId 精灵ID
   * @returns 特性ID数组
   */
  public GetAbilities(petId: number): number[] {
    return this.GetAbilityEntries(petId).map(e => e.id);
  }

  /**
   * 检查精灵是否有特性
   *
   * @param petId 精灵ID
   * @returns 是否有特性
   */
  public HasAbilities(petId: number): boolean {
    if (!this.loaded) {
      this.Load();
    }

    return this.abilityMap.has(petId);
  }

  /**
   * 检查BOSS是否存在
   *
   * @param mapId 地图ID
   * @param param2 参数2
   * @returns 是否存在
   */
  public HasBoss(mapId: number, param2: number): boolean {
    if (!this.loaded) {
      this.Load();
    }

    const actualMapId = this.mapAlias.get(mapId) || mapId;
    const paramMap = this.bossConfigMap.get(actualMapId);
    return paramMap !== undefined && paramMap.has(param2);
  }

  /**
   * 重新加载配置
   */
  public Reload(): void {
    this.loaded = false;
    this.abilityMap.clear();
    this.bossConfigMap.clear();
    this.petIdToConfigs.clear();
    this.sptIdToConfig.clear();
    this.mapAlias.clear();
    this.specialRules = {};
    this.sequentialTypeBreakIndex.clear();
    this.specialKillConditionIndex.clear();
    this.weekdayScheduleIndex.clear();
    this.Load();
  }

  // ==================== SPT BOSS 扩展方法 ====================

  /**
   * 根据SPT任务ID获取BOSS配置
   * @param sptId SPT任务ID (1-20)
   * @returns BOSS配置，如果不存在返回undefined
   */
  public GetBossBySPTId(sptId: number): IBossConfig | undefined {
    if (!this.loaded) {
      this.Load();
    }

    return this.sptIdToConfig.get(sptId);
  }

  /**
   * 获取所有SPT BOSS配置
   * @returns SPT BOSS配置数组，按sptId排序
   */
  public GetAllSPTBosses(): IBossConfig[] {
    if (!this.loaded) {
      this.Load();
    }

    const sptBosses: IBossConfig[] = [];
    for (const paramMap of this.bossConfigMap.values()) {
      for (const boss of paramMap.values()) {
        if (boss.spt && boss.spt.sptId > 0) {
          sptBosses.push(boss);
        }
      }
    }

    // 按sptId排序
    sptBosses.sort((a, b) => (a.spt?.sptId || 0) - (b.spt?.sptId || 0));
    return sptBosses;
  }

  /**
   * 检查BOSS是否为SPT BOSS
   * @param mapId 地图ID
   * @param param2 参数2
   * @returns 是否为SPT BOSS
   */
  public IsSPTBoss(mapId: number, param2: number): boolean {
    const boss = this.GetBossConfigByMapAndParam(mapId, param2);
    return boss !== undefined && boss.spt !== undefined && boss.spt.sptId > 0;
  }

  /**
   * 检查BOSS是否有首次击败奖励
   * @param mapId 地图ID
   * @param param2 参数2
   * @returns 是否有首次击败奖励
   */
  public HasFirstDefeatReward(mapId: number, param2: number): boolean {
    const boss = this.GetBossConfigByMapAndParam(mapId, param2);
    if (!boss || !boss.spt) {
      return false;
    }

    return (boss.spt.rewardPetId !== undefined && boss.spt.rewardPetId > 0) ||
           (boss.spt.rewardItemId !== undefined && boss.spt.rewardItemId > 0);
  }

  /**
   * 构建BOSS成就数据（200字节）
   * @param defeatedSPTBossIds 已击败的SPT BOSS petId列表
   * @returns 200字节的成就数据
   */
  public BuildBossAchievement(defeatedSPTBossIds: number[]): Buffer {
    if (!this.loaded) {
      this.Load();
    }

    const out = Buffer.alloc(200);
    const petIdToSPTIndex = new Map<number, number>();

    // 构建 petId -> sptIndex 映射
    for (const paramMap of this.bossConfigMap.values()) {
      for (const boss of paramMap.values()) {
        if (boss.spt && boss.spt.sptId >= 1 && boss.spt.sptId <= 200) {
          petIdToSPTIndex.set(boss.petId, boss.spt.sptId - 1);
        }
      }
    }

    // 标记已击败的BOSS
    for (const petId of defeatedSPTBossIds) {
      const idx = petIdToSPTIndex.get(petId);
      if (idx !== undefined && idx < 200) {
        out[idx] = 1;
      }
    }

    return out;
  }

  /**
   * 从成就数据中解析已击败的SPT BOSS petId列表
   * @param achievementData 200字节的成就数据
   * @returns 已击败的BOSS petId数组
   */
  public ParseBossAchievement(achievementData: Buffer): number[] {
    if (!this.loaded) {
      this.Load();
    }

    const defeatedPetIds: number[] = [];
    const sptIndexToPetId = new Map<number, number>();

    // 构建 sptIndex -> petId 映射
    for (const paramMap of this.bossConfigMap.values()) {
      for (const boss of paramMap.values()) {
        if (boss.spt && boss.spt.sptId >= 1 && boss.spt.sptId <= 200) {
          sptIndexToPetId.set(boss.spt.sptId - 1, boss.petId);
        }
      }
    }

    // 解析成就数据
    for (let i = 0; i < Math.min(achievementData.length, 200); i++) {
      if (achievementData[i] === 1) {
        const petId = sptIndexToPetId.get(i);
        if (petId !== undefined) {
          defeatedPetIds.push(petId);
        }
      }
    }

    return defeatedPetIds;
  }

  /**
   * 获取配置统计信息
   * @returns 统计信息对象
   */
  public GetStats(): {
    totalBosses: number;
    sptBosses: number;
  } {
    if (!this.loaded) {
      this.Load();
    }

    let totalBosses = 0;
    let sptBossCount = 0;
    
    for (const paramMap of this.bossConfigMap.values()) {
      for (const boss of paramMap.values()) {
        totalBosses++;
        if (boss.spt && boss.spt.sptId > 0) {
          sptBossCount++;
        }
      }
    }

    return {
      totalBosses,
      sptBosses: sptBossCount,
    };
  }

  // ==================== 特殊BOSS规则 ====================

  /**
   * 检查是否为顺序破防BOSS（如哈莫雷特）
   * @param petId 精灵ID
   * @returns 是否为顺序破防BOSS
   */
  public IsSequentialTypeBreakBoss(petId: number): boolean {
    if (!this.loaded) {
      this.Load();
    }
    return this.sequentialTypeBreakIndex.has(petId);
  }

  /**
   * 获取顺序破防BOSS当前阶段所需的属性类型
   * @param petId 精灵ID
   * @param phase 当前阶段（从0开始）
   * @returns 属性类型，如果不是顺序破防BOSS或配置不存在返回undefined
   */
  public GetSequentialTypeBreakRequiredType(petId: number, phase: number): number | undefined {
    if (!this.loaded) {
      this.Load();
    }

    const rule = this.sequentialTypeBreakIndex.get(petId);
    if (!rule || !rule.typeSequence || rule.typeSequence.length === 0) {
      return undefined;
    }

    const index = phase % rule.typeSequence.length;
    return rule.typeSequence[index];
  }

  /**
   * 获取顺序破防规则配置
   * @param petId 精灵ID
   * @returns 顺序破防规则，如果不存在返回undefined
   */
  public GetSequentialTypeBreakRule(petId: number): ISequentialTypeBreakRule | undefined {
    if (!this.loaded) {
      this.Load();
    }
    return this.sequentialTypeBreakIndex.get(petId);
  }

  /**
   * 获取所有顺序破防规则
   * @returns 顺序破防规则数组
   */
  public GetAllSequentialTypeBreakRules(): ISequentialTypeBreakRule[] {
    if (!this.loaded) {
      this.Load();
    }
    return this.specialRules.sequentialTypeBreak || [];
  }

  /**
   * 检查是否为特殊击杀条件BOSS（如尤纳斯）
   * @param petId 精灵ID
   * @returns 是否为特殊击杀条件BOSS
   */
  public IsSpecialKillConditionBoss(petId: number): boolean {
    if (!this.loaded) {
      this.Load();
    }
    return this.specialKillConditionIndex.has(petId);
  }

  /**
   * 获取特殊击杀条件规则配置
   * @param petId 精灵ID
   * @returns 特殊击杀条件规则，如果不存在返回undefined
   */
  public GetSpecialKillConditionRule(petId: number): ISpecialKillConditionRule | undefined {
    if (!this.loaded) {
      this.Load();
    }
    return this.specialKillConditionIndex.get(petId);
  }

  /**
   * 获取所有特殊击杀条件规则
   * @returns 特殊击杀条件规则数组
   */
  public GetAllSpecialKillConditionRules(): ISpecialKillConditionRule[] {
    if (!this.loaded) {
      this.Load();
    }
    return this.specialRules.specialKillCondition || [];
  }

  /**
   * 根据周几获取周几出现BOSS的地图ID和挑战条件
   * @param petId 精灵ID
   * @param weekday 周几（0=周日, 1=周一, ..., 6=周六）
   * @returns 地图ID和挑战条件，如果不存在返回undefined
   */
  public GetWeekdayScheduleByWeekday(petId: number, weekday: number): { 
    mapId: number; 
    mapName: string;
    condition: string; 
    conditionValue?: number;
    conditionDesc: string;
  } | undefined {
    if (!this.loaded) {
      this.Load();
    }

    const rule = this.weekdayScheduleIndex.get(petId);
    if (!rule || !rule.schedule) {
      return undefined;
    }

    for (const schedule of rule.schedule) {
      if (schedule.weekdays.includes(weekday)) {
        return { 
          mapId: schedule.mapId, 
          mapName: schedule.mapName,
          condition: schedule.condition,
          conditionValue: schedule.conditionValue,
          conditionDesc: schedule.conditionDesc
        };
      }
    }

    return undefined;
  }

  /**
   * 检查是否为周几出现规则BOSS（如盖亚）
   * @param petId 精灵ID
   * @returns 是否为周几出现规则BOSS
   */
  public IsWeekdayScheduleBoss(petId: number): boolean {
    if (!this.loaded) {
      this.Load();
    }
    return this.weekdayScheduleIndex.has(petId);
  }

  /**
   * 获取周几出现规则配置
   * @param petId 精灵ID
   * @returns 周几出现规则，如果不存在返回undefined
   */
  public GetWeekdayScheduleRule(petId: number): IWeekdayScheduleRule | undefined {
    if (!this.loaded) {
      this.Load();
    }
    return this.weekdayScheduleIndex.get(petId);
  }

  /**
   * 获取所有周几出现规则
   * @returns 周几出现规则数组
   */
  public GetAllWeekdayScheduleRules(): IWeekdayScheduleRule[] {
    if (!this.loaded) {
      this.Load();
    }
    return this.specialRules.weekdaySchedule || [];
  }

  /**
   * 获取所有特殊规则配置
   * @returns 特殊规则对象
   */
  public GetSpecialRules(): ISpecialRules {
    if (!this.loaded) {
      this.Load();
    }
    return this.specialRules;
  }
}
