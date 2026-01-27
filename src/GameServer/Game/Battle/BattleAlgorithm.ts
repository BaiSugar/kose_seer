/**
 * 赛尔号战斗算法系统
 * 整合属性计算、伤害公式、速度判定等核心战斗逻辑
 * 
 * 移植自: luvit/luvit_version/game/seer_algorithm.lua
 */

/**
 * 精灵种族值接口
 */
export interface IPetBaseStats {
  hp: number;
  attack: number;
  defence: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

/**
 * 性格修正接口
 */
export interface INatureModifiers {
  attack: number;
  defence: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

/**
 * 技能类型枚举
 */
export enum SkillCategory {
  PHYSICAL = 1,   // 物理攻击
  SPECIAL = 2,    // 特殊攻击
  STATUS = 3,     // 属性攻击(变化技)
}

/**
 * 计算后的属性值
 */
export interface ICalculatedStats {
  hp: number;
  maxHp: number;
  attack: number;
  defence: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

/**
 * 努力值（学习力）
 */
export interface IEffortValues {
  hp: number;
  attack: number;
  defence: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

/**
 * 伤害计算选项
 */
export interface IDamageOptions {
  isCrit?: boolean;           // 是否暴击
  weather?: number;           // 天气效果
  sealBonus?: number;         // 刻印加成
  teamBonus?: number;         // 战队加成
  otherBonus?: number;        // 其他加成
}

/**
 * 伤害计算结果
 */
export interface IDamageResult {
  damage: number;             // 最终伤害
  effectiveness: number;      // 属性克制倍率
  isCrit: boolean;            // 是否暴击
}

/**
 * 战斗算法类
 */
export class BattleAlgorithm {

  // ==================== 属性计算 ====================

  /**
   * 计算精灵属性（完整版）
   * 
   * 赛尔号属性计算公式（官方）:
   * - 体力: (种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 等级 + 10
   * - 非体力: [(种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 5] × 性格修正
   * 
   * @param baseStats 种族值
   * @param level 等级 (1-100)
   * @param iv 个体值 (0-31)，越高越好
   * @param ev 学习力/努力值，每项0-255，总和≤510
   * @param natureId 性格ID (1-26)
   * @returns 计算后的属性值
   */
  public static CalculateStats(
    baseStats: IPetBaseStats,
    level: number,
    iv: number = 31,
    ev?: IEffortValues,
    natureId?: number
  ): ICalculatedStats {
    // 默认值
    ev = ev || { hp: 0, attack: 0, defence: 0, spAtk: 0, spDef: 0, speed: 0 };
    natureId = natureId || 21; // 默认害羞(平衡)
    level = Math.max(1, Math.min(100, level));

    // 获取性格修正
    const natureMods = this.GetNatureModifiers(natureId);

    // 体力计算（不受性格影响）
    // 公式: (种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 等级 + 10
    const hp = Math.floor(
      (baseStats.hp * 2 + iv + Math.floor(ev.hp / 4)) * level / 100 + level + 10
    );

    // 非体力属性计算
    // 公式: [(种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 5] × 性格修正
    const calcStat = (base: number, evVal: number, natureMod: number): number => {
      const basePart = (base * 2 + iv + Math.floor(evVal / 4)) * level / 100 + 5;
      return Math.floor(basePart * natureMod);
    };

    return {
      hp,
      maxHp: hp,
      attack: calcStat(baseStats.attack, ev.attack, natureMods.attack),
      defence: calcStat(baseStats.defence, ev.defence, natureMods.defence),
      spAtk: calcStat(baseStats.spAtk, ev.spAtk, natureMods.spAtk),
      spDef: calcStat(baseStats.spDef, ev.spDef, natureMods.spDef),
      speed: calcStat(baseStats.speed, ev.speed, natureMods.speed),
    };
  }

  /**
   * 计算精灵属性（简化版）
   * 只用种族值和等级快速计算（用于NPC/野怪）
   * 
   * @param baseStats 种族值
   * @param level 等级
   * @returns 计算后的属性值
   */
  public static CalculateStatsSimple(
    baseStats: IPetBaseStats,
    level: number
  ): ICalculatedStats {
    level = Math.max(1, Math.min(100, level));

    // 假设个体值15（中等），无学习力，平衡性格
    const iv = 15;

    const hp = Math.floor((baseStats.hp * 2 + iv) * level / 100 + level + 10);

    const calcStat = (base: number): number => {
      return Math.floor((base * 2 + iv) * level / 100 + 5);
    };

    return {
      hp,
      maxHp: hp,
      attack: calcStat(baseStats.attack),
      defence: calcStat(baseStats.defence),
      spAtk: calcStat(baseStats.spAtk),
      spDef: calcStat(baseStats.spDef),
      speed: calcStat(baseStats.speed),
    };
  }

  // ==================== 伤害计算 ====================

  /**
   * 计算伤害
   * 
   * 赛尔号基础伤害公式: (等级×0.4+2) × 威力 × 攻击÷防御 ÷ 50 + 2
   * 
   * @param attackerStats 攻击方属性
   * @param defenderStats 防守方属性
   * @param attackerType 攻击方属性类型
   * @param defenderType 防守方属性类型
   * @param attackerLevel 攻击方等级
   * @param skillPower 技能威力
   * @param skillType 技能属性类型
   * @param skillCategory 技能类别
   * @param attackerStageModifiers 攻击方能力等级修正
   * @param defenderStageModifiers 防守方能力等级修正
   * @param options 可选参数
   * @returns 伤害计算结果
   */
  public static CalculateDamage(
    attackerStats: ICalculatedStats,
    defenderStats: ICalculatedStats,
    attackerType: number,
    defenderType: number,
    attackerLevel: number,
    skillPower: number,
    skillType: number,
    skillCategory: SkillCategory,
    attackerStageModifiers?: number[],
    defenderStageModifiers?: number[],
    options?: IDamageOptions
  ): IDamageResult {
    options = options || {};

    // 变化技不造成伤害
    if (skillCategory === SkillCategory.STATUS) {
      return { damage: 0, effectiveness: 1, isCrit: false };
    }

    const level = attackerLevel || 100;
    const power = skillPower || 40;

    // 根据技能类型选择攻击/防御属性
    let atkStat: number;
    let defStat: number;

    if (skillCategory === SkillCategory.PHYSICAL) {
      // 物理攻击
      atkStat = attackerStats.attack;
      defStat = defenderStats.defence;

      // 应用能力等级修正
      if (attackerStageModifiers && attackerStageModifiers[0] !== undefined) {
        atkStat = this.ApplyStageModifier(atkStat, attackerStageModifiers[0]);
      }
      if (defenderStageModifiers && defenderStageModifiers[1] !== undefined) {
        defStat = this.ApplyStageModifier(defStat, defenderStageModifiers[1]);
      }
    } else {
      // 特殊攻击
      atkStat = attackerStats.spAtk;
      defStat = defenderStats.spDef;

      // 应用能力等级修正
      if (attackerStageModifiers && attackerStageModifiers[2] !== undefined) {
        atkStat = this.ApplyStageModifier(atkStat, attackerStageModifiers[2]);
      }
      if (defenderStageModifiers && defenderStageModifiers[3] !== undefined) {
        defStat = this.ApplyStageModifier(defStat, defenderStageModifiers[3]);
      }
    }

    // 防止除零
    defStat = Math.max(1, defStat);

    // 赛尔号基础伤害公式: (等级×0.4+2) × 威力 × 攻击÷防御 ÷ 50 + 2
    const baseDamage = (level * 0.4 + 2) * power * atkStat / defStat / 50 + 2;

    // 属性克制倍率
    const effectiveness = this.GetTypeEffectiveness(skillType, defenderType);

    // 本系加成 (STAB - Same Type Attack Bonus)
    const stab = skillType === attackerType ? 1.5 : 1.0;

    // 暴击判定 (默认6.25%几率, 伤害1.5倍)
    let isCrit = options.isCrit !== undefined ? options.isCrit : Math.random() < 0.0625;
    const critMod = isCrit ? 1.5 : 1.0;

    // 随机波动 (85%-100%)
    const randomMod = (85 + Math.random() * 15) / 100;

    // 刻印加成 (可选)
    const sealBonus = options.sealBonus || 1.0;

    // 战队加成 (可选)
    const teamBonus = options.teamBonus || 1.0;

    // 其他加成 (天气、道具等)
    const otherBonus = options.otherBonus || 1.0;

    // 最终伤害
    let finalDamage = Math.floor(
      baseDamage * effectiveness * stab * critMod * randomMod * 
      sealBonus * teamBonus * otherBonus
    );

    // 最小伤害为1（除非无效）
    if (effectiveness > 0 && finalDamage < 1) {
      finalDamage = 1;
    }

    return {
      damage: finalDamage,
      effectiveness,
      isCrit
    };
  }

  // ==================== 速度判定 ====================

  /**
   * 判断先手顺序
   * 
   * @param attackerSpeed 攻击方速度
   * @param defenderSpeed 防守方速度
   * @param attackerPriority 攻击方技能优先度
   * @param defenderPriority 防守方技能优先度
   * @returns 1 (攻击方先手), -1 (防守方先手), 0 (同速随机)
   */
  public static DetermineFirstMove(
    attackerSpeed: number,
    defenderSpeed: number,
    attackerPriority: number = 0,
    defenderPriority: number = 0
  ): number {
    // 先比较技能优先度
    if (attackerPriority > defenderPriority) {
      return 1;
    } else if (attackerPriority < defenderPriority) {
      return -1;
    }

    // 优先度相同，比较速度
    if (attackerSpeed > defenderSpeed) {
      return 1;
    } else if (attackerSpeed < defenderSpeed) {
      return -1;
    } else {
      // 同速随机
      return Math.random() < 0.5 ? 1 : -1;
    }
  }

  // ==================== 能力等级系统 ====================

  /**
   * 能力等级倍率表 (等级 -6 到 +6)
   */
  private static readonly STAGE_MULTIPLIERS: { [stage: number]: number } = {
    [-6]: 2/8, [-5]: 2/7, [-4]: 2/6, [-3]: 2/5, [-2]: 2/4, [-1]: 2/3,
    [0]: 1,
    [1]: 3/2, [2]: 4/2, [3]: 5/2, [4]: 6/2, [5]: 7/2, [6]: 8/2
  };

  /**
   * 应用能力等级修正
   * 
   * @param baseStat 基础属性值
   * @param stage 能力等级 (-6 到 +6)
   * @returns 修正后的属性值
   */
  public static ApplyStageModifier(baseStat: number, stage: number): number {
    stage = Math.max(-6, Math.min(6, stage));
    const multiplier = this.STAGE_MULTIPLIERS[stage] || 1;
    return Math.floor(baseStat * multiplier);
  }

  // ==================== 属性克制系统 ====================

  /**
   * 属性克制表 (攻击属性 -> 被克制属性列表)
   * Type: 1草, 2水, 3火, 4飞行, 5电, 6机械, 7地面, 8普通, 9冰, 10超能, 11战斗, 12光, 13暗影, 14神秘, 15龙, 16圣灵
   */
  private static readonly TYPE_CHART: { [atkType: number]: number[] } = {
    [1]: [2, 7],           // 草克水、地面
    [2]: [3, 7],           // 水克火、地面
    [3]: [1, 6, 9],        // 火克草、机械、冰
    [4]: [1, 11],          // 飞行克草、战斗
    [5]: [2, 4],           // 电克水、飞行
    [6]: [9],              // 机械克冰
    [7]: [3, 5, 6],        // 地面克火、电、机械
    [8]: [],               // 普通无克制
    [9]: [1, 4, 7, 15],    // 冰克草、飞行、地面、龙
    [10]: [11],            // 超能克战斗
    [11]: [8, 9],          // 战斗克普通、冰
    [12]: [13],            // 光克暗影
    [13]: [10, 12],        // 暗影克超能、光
    [14]: [],              // 神秘
    [15]: [15],            // 龙克龙
    [16]: [13, 15]         // 圣灵克暗影、龙
  };

  /**
   * 获取属性克制倍率
   * 
   * @param atkType 攻击属性类型
   * @param defType 防守属性类型
   * @returns 克制倍率 (2.0=克制, 0.5=被克制, 1.0=普通)
   */
  public static GetTypeEffectiveness(atkType: number, defType: number): number {
    // 检查是否克制
    const dominated = this.TYPE_CHART[atkType] || [];
    if (dominated.includes(defType)) {
      return 2.0; // 克制
    }

    // 检查是否被克制
    const dominated2 = this.TYPE_CHART[defType] || [];
    if (dominated2.includes(atkType)) {
      return 0.5; // 被克制
    }

    return 1.0; // 普通
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取性格修正
   * 
   * @param natureId 性格ID
   * @returns 性格修正值
   */
  private static GetNatureModifiers(natureId: number): INatureModifiers {
    // 使用 NatureSystem 获取性格修正
    const { NatureSystem, StatType } = require('./NatureSystem');
    
    return {
      attack: NatureSystem.GetStatModifier(natureId, StatType.ATTACK),
      defence: NatureSystem.GetStatModifier(natureId, StatType.DEFENCE),
      spAtk: NatureSystem.GetStatModifier(natureId, StatType.SP_ATTACK),
      spDef: NatureSystem.GetStatModifier(natureId, StatType.SP_DEFENCE),
      speed: NatureSystem.GetStatModifier(natureId, StatType.SPEED)
    };
  }

  /**
   * 计算暴击率
   * 
   * @param baseRate 基础暴击率 (默认6.25%)
   * @param critStage 暴击等级 (0-4)
   * @returns 暴击率 (0-1)
   */
  public static CalculateCritRate(baseRate: number = 0.0625, critStage: number = 0): number {
    // 暴击等级倍率: 0=1x, 1=2x, 2=3x, 3=4x, 4=5x
    const multiplier = Math.min(5, critStage + 1);
    return Math.min(1.0, baseRate * multiplier);
  }

  /**
   * 计算命中率
   * 
   * @param skillAccuracy 技能基础命中率 (0-100)
   * @param accuracyStage 命中等级 (-6 到 +6)
   * @param evasionStage 闪避等级 (-6 到 +6)
   * @returns 最终命中率 (0-1)
   */
  public static CalculateHitRate(
    skillAccuracy: number,
    accuracyStage: number = 0,
    evasionStage: number = 0
  ): number {
    // 基础命中率
    let hitRate = skillAccuracy / 100;

    // 应用命中/闪避等级修正
    const netStage = accuracyStage - evasionStage;
    const stageMultiplier = this.ApplyStageModifier(100, netStage) / 100;

    hitRate *= stageMultiplier;

    return Math.max(0, Math.min(1, hitRate));
  }
}
