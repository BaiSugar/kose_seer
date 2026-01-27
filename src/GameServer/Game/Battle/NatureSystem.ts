/**
 * 赛尔号性格系统
 * 26种性格，影响精灵属性成长
 * 
 * 移植自: luvit/luvit_version/game/seer_natures.lua
 * 
 * 性格规则：
 * - 增益属性：+10% (倍率 1.1)
 * - 减益属性：-10% (倍率 0.9)
 * - 平衡型：无属性变化 (倍率 1.0)
 * - 体力(HP)不受性格影响
 * 
 * 数据来源：config/data/json/natures.json
 */

import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Logger } from '../../../shared/utils';

/**
 * 属性类型枚举
 */
export enum StatType {
  ATTACK = 1,      // 攻击
  DEFENCE = 2,     // 防御
  SP_ATTACK = 3,   // 特攻
  SP_DEFENCE = 4,  // 特防
  SPEED = 5        // 速度
}

/**
 * 性格数据接口
 */
export interface INatureData {
  id: number;           // 性格ID (1-26)
  name: string;         // 性格名称
  upStat?: StatType;    // 增益属性 (+10%)
  downStat?: StatType;  // 减益属性 (-10%)
  category: string;     // 性格类别
}

/**
 * 属性修正值接口
 */
export interface IStatModifiers {
  attack: number;    // 攻击修正 (0.9, 1.0, 1.1)
  defence: number;   // 防御修正
  spAttack: number;  // 特攻修正
  spDefence: number; // 特防修正
  speed: number;     // 速度修正
}

/**
 * 精灵属性接口（用于应用性格修正）
 */
export interface IPetStats {
  hp: number;        // 体力（不受性格影响）
  attack: number;    // 攻击
  defence: number;   // 防御
  spAttack: number;  // 特攻
  spDefence: number; // 特防
  speed: number;     // 速度
}

/**
 * 精灵定位类型（用于推荐性格）
 */
export enum PetRole {
  PHYSICAL = 'physical',       // 物理攻击手
  SPECIAL = 'special',         // 特殊攻击手
  TANK_DEF = 'tank_def',       // 物防肉盾
  TANK_SPDEF = 'tank_spdef',   // 特防肉盾
  SPEED = 'speed',             // 速度型
  BALANCED = 'balanced'        // 平衡型
}

/**
 * 性格系统类
 * 提供性格数据查询、属性修正计算等功能
 */
export class NatureSystem {

  /**
   * 属性名称映射
   */
  private static readonly STAT_NAMES: { [key in StatType]: string } = {
    [StatType.ATTACK]: '攻击',
    [StatType.DEFENCE]: '防御',
    [StatType.SP_ATTACK]: '特攻',
    [StatType.SP_DEFENCE]: '特防',
    [StatType.SPEED]: '速度'
  };

  /**
   * 性格数据缓存
   */
  private static natureDataCache: { [id: number]: INatureData } | null = null;

  /**
   * 加载性格数据
   */
  private static LoadNatureData(): { [id: number]: INatureData } {
    if (this.natureDataCache) {
      return this.natureDataCache;
    }

    try {
      const config = GameConfig.GetNatureConfig();
      if (!config || !config.natures) {
        Logger.Warn('[NatureSystem] 性格配置未加载');
        return {};
      }

      const natureMap: { [id: number]: INatureData } = {};
      for (const nature of config.natures) {
        natureMap[nature.id] = {
          id: nature.id,
          name: nature.name,
          upStat: nature.upStat,
          downStat: nature.downStat,
          category: nature.category
        };
      }

      this.natureDataCache = natureMap;
      return natureMap;
    } catch (error) {
      Logger.Error('[NatureSystem] 加载性格数据失败', error as Error);
      // 返回空对象，避免崩溃
      return {};
    }
  }

  /**
   * 获取性格数据（内部使用）
   */
  private static get NATURE_DATA(): { [id: number]: INatureData } {
    return this.LoadNatureData();
  }

  /**
   * 旧的硬编码数据（已废弃，保留作为备份）
   */
  private static readonly NATURE_DATA_BACKUP: { [id: number]: INatureData } = {
    // ==================== 攻击强化类 (1-4) ====================
    1: {
      id: 1,
      name: '孤独',
      upStat: StatType.ATTACK,
      downStat: StatType.DEFENCE,
      category: '攻击强化'
    },
    2: {
      id: 2,
      name: '勇敢',
      upStat: StatType.ATTACK,
      downStat: StatType.SPEED,
      category: '攻击强化'
    },
    3: {
      id: 3,
      name: '固执',
      upStat: StatType.ATTACK,
      downStat: StatType.SP_ATTACK,
      category: '攻击强化'
    },
    4: {
      id: 4,
      name: '调皮',
      upStat: StatType.ATTACK,
      downStat: StatType.SP_DEFENCE,
      category: '攻击强化'
    },

    // ==================== 速度强化类 (5-8) ====================
    5: {
      id: 5,
      name: '胆小',
      upStat: StatType.SPEED,
      downStat: StatType.ATTACK,
      category: '速度强化'
    },
    6: {
      id: 6,
      name: '急躁',
      upStat: StatType.SPEED,
      downStat: StatType.DEFENCE,
      category: '速度强化'
    },
    7: {
      id: 7,
      name: '开朗',
      upStat: StatType.SPEED,
      downStat: StatType.SP_ATTACK,
      category: '速度强化'
    },
    8: {
      id: 8,
      name: '天真',
      upStat: StatType.SPEED,
      downStat: StatType.SP_DEFENCE,
      category: '速度强化'
    },

    // ==================== 防御强化类 (9-12) ====================
    9: {
      id: 9,
      name: '大胆',
      upStat: StatType.DEFENCE,
      downStat: StatType.ATTACK,
      category: '防御强化'
    },
    10: {
      id: 10,
      name: '悠闲',
      upStat: StatType.DEFENCE,
      downStat: StatType.SPEED,
      category: '防御强化'
    },
    11: {
      id: 11,
      name: '顽皮',
      upStat: StatType.DEFENCE,
      downStat: StatType.SP_ATTACK,
      category: '防御强化'
    },
    12: {
      id: 12,
      name: '无虑',
      upStat: StatType.DEFENCE,
      downStat: StatType.SP_DEFENCE,
      category: '防御强化'
    },

    // ==================== 特攻强化类 (13-16) ====================
    13: {
      id: 13,
      name: '保守',
      upStat: StatType.SP_ATTACK,
      downStat: StatType.ATTACK,
      category: '特攻强化'
    },
    14: {
      id: 14,
      name: '稳重',
      upStat: StatType.SP_ATTACK,
      downStat: StatType.DEFENCE,
      category: '特攻强化'
    },
    15: {
      id: 15,
      name: '冷静',
      upStat: StatType.SP_ATTACK,
      downStat: StatType.SPEED,
      category: '特攻强化'
    },
    16: {
      id: 16,
      name: '马虎',
      upStat: StatType.SP_ATTACK,
      downStat: StatType.SP_DEFENCE,
      category: '特攻强化'
    },

    // ==================== 特防强化类 (17-20) ====================
    17: {
      id: 17,
      name: '沉着',
      upStat: StatType.SP_DEFENCE,
      downStat: StatType.ATTACK,
      category: '特防强化'
    },
    18: {
      id: 18,
      name: '温顺',
      upStat: StatType.SP_DEFENCE,
      downStat: StatType.DEFENCE,
      category: '特防强化'
    },
    19: {
      id: 19,
      name: '狂妄',
      upStat: StatType.SP_DEFENCE,
      downStat: StatType.SPEED,
      category: '特防强化'
    },
    20: {
      id: 20,
      name: '慎重',
      upStat: StatType.SP_DEFENCE,
      downStat: StatType.SP_ATTACK,
      category: '特防强化'
    },

    // ==================== 平衡型 (21-26) ====================
    21: {
      id: 21,
      name: '害羞',
      category: '平衡型'
    },
    22: {
      id: 22,
      name: '浮躁',
      category: '平衡型'
    },
    23: {
      id: 23,
      name: '坦率',
      category: '平衡型'
    },
    24: {
      id: 24,
      name: '实干',
      category: '平衡型'
    },
    25: {
      id: 25,
      name: '认真',
      category: '平衡型'
    },
    26: {
      id: 26,
      name: '随和',
      category: '平衡型'
    }
  };

  /**
   * 推荐性格映射（根据精灵定位）
   */
  private static readonly RECOMMENDED_NATURES: { [role in PetRole]: number[] } = {
    [PetRole.PHYSICAL]: [3, 1, 2, 4],      // 固执、孤独、勇敢、调皮
    [PetRole.SPECIAL]: [15, 13, 14, 16],   // 冷静、保守、稳重、马虎
    [PetRole.TANK_DEF]: [10, 9, 11, 12],   // 悠闲、大胆、顽皮、无虑
    [PetRole.TANK_SPDEF]: [19, 17, 18, 20],// 狂妄、沉着、温顺、慎重
    [PetRole.SPEED]: [5, 6, 7, 8],         // 胆小、急躁、开朗、天真
    [PetRole.BALANCED]: [21, 22, 23, 24, 25, 26] // 平衡型
  };

  // ==================== 核心方法 ====================

  /**
   * 获取性格数据
   * 
   * @param natureId 性格ID (1-26)
   * @returns 性格数据，如果ID无效则返回undefined
   */
  public static GetNature(natureId: number): INatureData | undefined {
    return this.NATURE_DATA[natureId];
  }

  /**
   * 获取性格名称
   * 
   * @param natureId 性格ID (1-26)
   * @returns 性格名称，如果ID无效则返回"未知"
   */
  public static GetNatureName(natureId: number): string {
    const nature = this.NATURE_DATA[natureId];
    return nature ? nature.name : '未知';
  }

  /**
   * 获取性格对某属性的修正倍率
   * 
   * @param natureId 性格ID (1-26)
   * @param statType 属性类型
   * @returns 修正倍率 (1.1=增益, 0.9=减益, 1.0=无变化)
   */
  public static GetStatModifier(natureId: number, statType: StatType): number {
    const nature = this.NATURE_DATA[natureId];
    if (!nature) {
      return 1.0;
    }

    // 增益属性 +10%
    if (nature.upStat === statType) {
      return 1.1;
    }

    // 减益属性 -10%
    if (nature.downStat === statType) {
      return 0.9;
    }

    // 无变化
    return 1.0;
  }

  /**
   * 获取性格的所有属性修正
   * 
   * @param natureId 性格ID (1-26)
   * @returns 所有属性的修正倍率
   */
  public static GetAllModifiers(natureId: number): IStatModifiers {
    return {
      attack: this.GetStatModifier(natureId, StatType.ATTACK),
      defence: this.GetStatModifier(natureId, StatType.DEFENCE),
      spAttack: this.GetStatModifier(natureId, StatType.SP_ATTACK),
      spDefence: this.GetStatModifier(natureId, StatType.SP_DEFENCE),
      speed: this.GetStatModifier(natureId, StatType.SPEED)
    };
  }

  /**
   * 应用性格修正到属性值
   * 
   * 注意：体力(HP)不受性格影响
   * 
   * @param natureId 性格ID (1-26)
   * @param stats 原始属性值
   * @returns 应用性格修正后的属性值
   */
  public static ApplyNatureToStats(natureId: number, stats: IPetStats): IPetStats {
    const modifiers = this.GetAllModifiers(natureId);

    return {
      hp: stats.hp, // 体力不受性格影响
      attack: Math.floor(stats.attack * modifiers.attack),
      defence: Math.floor(stats.defence * modifiers.defence),
      spAttack: Math.floor(stats.spAttack * modifiers.spAttack),
      spDefence: Math.floor(stats.spDefence * modifiers.spDefence),
      speed: Math.floor(stats.speed * modifiers.speed)
    };
  }

  /**
   * 获取性格描述
   * 
   * @param natureId 性格ID (1-26)
   * @returns 性格描述文本
   * 
   * @example
   * GetNatureDescription(1) // "孤独: 攻击+10%, 防御-10%"
   * GetNatureDescription(21) // "害羞: 平衡型（无属性变化）"
   */
  public static GetNatureDescription(natureId: number): string {
    const nature = this.NATURE_DATA[natureId];
    if (!nature) {
      return '未知性格';
    }

    // 平衡型性格
    if (!nature.upStat || !nature.downStat) {
      return `${nature.name}: 平衡型（无属性变化）`;
    }

    // 有增益/减益的性格
    const upStatName = this.STAT_NAMES[nature.upStat];
    const downStatName = this.STAT_NAMES[nature.downStat];

    return `${nature.name}: ${upStatName}+10%, ${downStatName}-10%`;
  }

  /**
   * 随机获取一个性格ID
   * 
   * @returns 随机性格ID (1-26)
   */
  public static GetRandomNature(): number {
    return Math.floor(Math.random() * 26) + 1;
  }

  /**
   * 根据名称获取性格ID
   * 
   * @param name 性格名称
   * @returns 性格ID，如果未找到则返回undefined
   */
  public static GetNatureIdByName(name: string): number | undefined {
    for (const id in this.NATURE_DATA) {
      if (this.NATURE_DATA[id].name === name) {
        return parseInt(id);
      }
    }
    return undefined;
  }

  /**
   * 获取推荐性格列表
   * 
   * @param role 精灵定位类型
   * @returns 推荐的性格ID列表
   * 
   * @example
   * GetRecommendedNatures(PetRole.PHYSICAL) // [3, 1, 2, 4] (固执、孤独、勇敢、调皮)
   */
  public static GetRecommendedNatures(role: PetRole): number[] {
    return this.RECOMMENDED_NATURES[role] || this.RECOMMENDED_NATURES[PetRole.BALANCED];
  }

  /**
   * 获取所有性格数据
   * 
   * @returns 所有26种性格的数据数组
   */
  public static GetAllNatures(): INatureData[] {
    const natures: INatureData[] = [];
    for (let id = 1; id <= 26; id++) {
      const nature = this.NATURE_DATA[id];
      if (nature) {
        natures.push(nature);
      }
    }
    return natures;
  }

  /**
   * 按类别获取性格列表
   * 
   * @param category 性格类别
   * @returns 该类别的性格ID列表
   */
  public static GetNaturesByCategory(category: string): number[] {
    const natureIds: number[] = [];
    for (const id in this.NATURE_DATA) {
      if (this.NATURE_DATA[id].category === category) {
        natureIds.push(parseInt(id));
      }
    }
    return natureIds;
  }

  /**
   * 验证性格ID是否有效
   * 
   * @param natureId 性格ID
   * @returns 是否有效
   */
  public static IsValidNature(natureId: number): boolean {
    return natureId >= 1 && natureId <= 26 && this.NATURE_DATA[natureId] !== undefined;
  }

  // ==================== 调试和测试方法 ====================

  /**
   * 打印所有性格信息（用于调试）
   */
  public static PrintAllNatures(): void {
    console.log('========== 赛尔号性格系统 ==========');
    for (let id = 1; id <= 26; id++) {
      console.log(`[${id.toString().padStart(2, '0')}] ${this.GetNatureDescription(id)}`);
    }
    console.log('====================================');
  }

  /**
   * 测试性格修正（用于调试）
   * 
   * @param natureId 性格ID
   */
  public static TestNature(natureId: number): void {
    const testStats: IPetStats = {
      hp: 100,
      attack: 100,
      defence: 100,
      spAttack: 100,
      spDefence: 100,
      speed: 100
    };

    const result = this.ApplyNatureToStats(natureId, testStats);

    console.log(`[性格测试] ${this.GetNatureDescription(natureId)}`);
    console.log(`  基础: HP=${testStats.hp} ATK=${testStats.attack} DEF=${testStats.defence} SPA=${testStats.spAttack} SPD=${testStats.spDefence} SPE=${testStats.speed}`);
    console.log(`  修正: HP=${result.hp} ATK=${result.attack} DEF=${result.defence} SPA=${result.spAttack} SPD=${result.spDefence} SPE=${result.speed}`);
  }
}
