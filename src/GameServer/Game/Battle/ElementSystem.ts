/**
 * 赛尔号属性克制系统
 * 26种属性，包含完整的克制关系和伤害倍率计算
 * 
 * 移植自: luvit/luvit_version/game/seer_elements.lua
 * 
 * 克制规则：
 * - 2.0 = 克制（效果拔群）
 * - 1.0 = 普通（效果一般）
 * - 0.5 = 被克制（效果不佳）
 * - 0.0 = 无效（完全无效）
 * 
 * 数据来源：config/data/json/elements.json
 */

import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Logger } from '../../../shared/utils';

/**
 * 属性类型枚举
 */
export enum ElementType {
  GRASS = 1,      // 草
  WATER = 2,      // 水
  FIRE = 3,       // 火
  FLYING = 4,     // 飞行
  ELECTRIC = 5,   // 电
  MACHINE = 6,    // 机械
  GROUND = 7,     // 地面
  NORMAL = 8,     // 普通
  ICE = 9,        // 冰
  PSYCHIC = 10,   // 超能
  FIGHTING = 11,  // 战斗
  LIGHT = 12,     // 光
  DARK = 13,      // 暗影
  MYSTERY = 14,   // 神秘
  DRAGON = 15,    // 龙
  HOLY = 16,      // 圣灵
  DIMENSION = 17, // 次元
  ANCIENT = 18,   // 远古
  EVIL = 19,      // 邪灵
  NATURE = 20,    // 自然
  KING = 21,      // 王
  CHAOS = 22,     // 混沌
  DIVINE = 23,    // 神灵
  CYCLE = 24,     // 轮回
  BUG = 25,       // 虫
  VOID = 26       // 虚空
}

/**
 * 属性数据接口
 */
export interface IElementType {
  id: number;
  name: string;
  nameEn: string;
}

/**
 * 属性克制系统类
 */
export class ElementSystem {

  /**
   * 属性数据缓存
   */
  private static typeDataCache: IElementType[] | null = null;

  /**
   * 属性克制表缓存
   * effectiveness[攻击属性][防守属性] = 倍率
   */
  private static effectivenessCache: { [atkType: number]: { [defType: number]: number } } | null = null;

  /**
   * 加载属性数据
   */
  private static LoadElementData(): void {
    if (this.typeDataCache && this.effectivenessCache) {
      return;
    }

    try {
      const config = GameConfig.GetElementConfig();
      if (!config || !config.types || !config.effectiveness) {
        Logger.Warn('[ElementSystem] 属性配置未加载');
        this.typeDataCache = [];
        this.effectivenessCache = {};
        return;
      }

      // 加载属性类型数据
      this.typeDataCache = config.types;

      // 加载属性克制表
      this.effectivenessCache = {};
      
      // 初始化所有为1（普通效果）
      for (let i = 1; i <= 26; i++) {
        this.effectivenessCache[i] = {};
        for (let j = 1; j <= 26; j++) {
          this.effectivenessCache[i][j] = 1.0;
        }
      }

      // 应用克制关系
      for (const atkTypeStr in config.effectiveness) {
        const atkType = parseInt(atkTypeStr);
        const relations = config.effectiveness[atkTypeStr];
        
        for (const defTypeStr in relations) {
          const defType = parseInt(defTypeStr);
          const multiplier = relations[defTypeStr];
          this.effectivenessCache[atkType][defType] = multiplier;
        }
      }

    } catch (error) {
      Logger.Error('[ElementSystem] 加载属性数据失败', error as Error);
      // 初始化为空，避免崩溃
      this.typeDataCache = [];
      this.effectivenessCache = {};
    }
  }

  // ==================== 核心方法 ====================

  /**
   * 获取属性名称
   * 
   * @param typeId 属性ID (1-26)
   * @returns 属性名称
   */
  public static GetTypeName(typeId: number): string {
    this.LoadElementData();
    
    const type = this.typeDataCache?.find(t => t.id === typeId);
    return type ? type.name : '未知';
  }

  /**
   * 获取属性英文名称
   * 
   * @param typeId 属性ID (1-26)
   * @returns 属性英文名称
   */
  public static GetTypeNameEn(typeId: number): string {
    this.LoadElementData();
    
    const type = this.typeDataCache?.find(t => t.id === typeId);
    return type ? type.nameEn : 'UNKNOWN';
  }

  /**
   * 获取单属性对单属性的克制倍率
   * 
   * @param atkType 攻击属性类型
   * @param defType 防守属性类型
   * @returns 克制倍率 (2.0=克制, 1.0=普通, 0.5=被克制, 0.0=无效)
   */
  public static GetEffectiveness(atkType: number, defType: number): number {
    this.LoadElementData();

    if (!atkType || !defType) {
      return 1.0;
    }

    if (atkType < 1 || atkType > 26 || defType < 1 || defType > 26) {
      return 1.0;
    }

    return this.effectivenessCache?.[atkType]?.[defType] ?? 1.0;
  }

  /**
   * 单属性攻击双属性
   * 
   * 规则：
   * - 将双属性防守方的属性拆分，各自计算单属性攻击方对两者的克制系数
   * - 若两者均为2，则最终克制系数为4
   * - 若其中一项为0，则最终克制系数为两者之和÷4
   * - 若为其他情况，则最终克制系数为两者之和÷2
   * 
   * @param atkType 攻击属性
   * @param defType1 防守属性1
   * @param defType2 防守属性2
   * @returns 克制倍率
   */
  public static CalcSingleVsDual(atkType: number, defType1: number, defType2?: number): number {
    // 如果没有第二属性或两个属性相同，按单属性计算
    if (!defType2 || defType1 === defType2) {
      return this.GetEffectiveness(atkType, defType1);
    }

    const eff1 = this.GetEffectiveness(atkType, defType1);
    const eff2 = this.GetEffectiveness(atkType, defType2);

    // 两者均为克制
    if (eff1 === 2 && eff2 === 2) {
      return 4;
    }

    // 其中一项无效
    if (eff1 === 0 || eff2 === 0) {
      return (eff1 + eff2) / 4;
    }

    // 其他情况
    return (eff1 + eff2) / 2;
  }

  /**
   * 双属性攻击单属性
   * 
   * 规则：
   * - 将双属性攻击方的属性拆分，各自计算两者对单属性防守方的克制系数
   * - 若两者均为2，则最终克制系数为4
   * - 若其中一项为0，则最终克制系数为两者之和÷4
   * - 若为其他情况，则最终克制系数为两者之和÷2
   * 
   * @param atkType1 攻击属性1
   * @param atkType2 攻击属性2
   * @param defType 防守属性
   * @returns 克制倍率
   */
  public static CalcDualVsSingle(atkType1: number, atkType2: number | undefined, defType: number): number {
    // 如果没有第二属性或两个属性相同，按单属性计算
    if (!atkType2 || atkType1 === atkType2) {
      return this.GetEffectiveness(atkType1, defType);
    }

    const eff1 = this.GetEffectiveness(atkType1, defType);
    const eff2 = this.GetEffectiveness(atkType2, defType);

    // 两者均为克制
    if (eff1 === 2 && eff2 === 2) {
      return 4;
    }

    // 其中一项无效
    if (eff1 === 0 || eff2 === 0) {
      return (eff1 + eff2) / 4;
    }

    // 其他情况
    return (eff1 + eff2) / 2;
  }

  /**
   * 双属性攻击双属性
   * 
   * 规则：
   * - 将防守方的属性拆分，计算双属性攻击方对两者的克制系数，直接加总÷2
   * 
   * @param atkType1 攻击属性1
   * @param atkType2 攻击属性2
   * @param defType1 防守属性1
   * @param defType2 防守属性2
   * @returns 克制倍率
   */
  public static CalcDualVsDual(
    atkType1: number,
    atkType2: number | undefined,
    defType1: number,
    defType2: number | undefined
  ): number {
    // 如果攻击方是单属性
    if (!atkType2 || atkType1 === atkType2) {
      return this.CalcSingleVsDual(atkType1, defType1, defType2);
    }

    // 如果防守方是单属性
    if (!defType2 || defType1 === defType2) {
      return this.CalcDualVsSingle(atkType1, atkType2, defType1);
    }

    // 双属性攻击双属性：计算双属性攻击方对两个防守属性的克制系数，加总÷2
    const effVsDef1 = this.CalcDualVsSingle(atkType1, atkType2, defType1);
    const effVsDef2 = this.CalcDualVsSingle(atkType1, atkType2, defType2);

    return (effVsDef1 + effVsDef2) / 2;
  }

  /**
   * 通用计算函数（自动判断单/双属性）
   * 
   * @param atkType1 攻击属性1
   * @param atkType2 攻击属性2（可选）
   * @param defType1 防守属性1
   * @param defType2 防守属性2（可选）
   * @returns 克制倍率
   */
  public static CalculateEffectiveness(
    atkType1: number,
    atkType2: number | undefined,
    defType1: number,
    defType2: number | undefined
  ): number {
    return this.CalcDualVsDual(atkType1, atkType2, defType1, defType2);
  }

  // ==================== 本系加成 (STAB - Same Type Attack Bonus) ====================

  /**
   * 检查是否获得本系加成
   * 
   * 单属性精灵使用与其属性一致的技能会获得50%的威力加成
   * 双属性精灵除了本系技能外，使用其属性拆分后的单属性技能亦能获得同等效果
   * 
   * @param petType1 精灵属性1
   * @param petType2 精灵属性2（可选）
   * @param skillType1 技能属性1
   * @param skillType2 技能属性2（可选）
   * @returns 是否获得本系加成
   */
  public static HasSTAB(
    petType1: number,
    petType2: number | undefined,
    skillType1: number,
    skillType2: number | undefined
  ): boolean {
    // 精灵属性列表
    const petTypes: number[] = [petType1];
    if (petType2 && petType2 !== petType1) {
      petTypes.push(petType2);
    }

    // 技能属性列表
    const skillTypes: number[] = [skillType1];
    if (skillType2 && skillType2 !== skillType1) {
      skillTypes.push(skillType2);
    }

    // 检查是否有任意匹配
    for (const pt of petTypes) {
      for (const st of skillTypes) {
        if (pt === st) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 获取STAB倍率
   * 
   * @param petType1 精灵属性1
   * @param petType2 精灵属性2（可选）
   * @param skillType1 技能属性1
   * @param skillType2 技能属性2（可选）
   * @returns STAB倍率 (1.5或1.0)
   */
  public static GetSTABMultiplier(
    petType1: number,
    petType2: number | undefined,
    skillType1: number,
    skillType2: number | undefined
  ): number {
    return this.HasSTAB(petType1, petType2, skillType1, skillType2) ? 1.5 : 1.0;
  }

  // ==================== 完整伤害倍率计算 ====================

  /**
   * 计算包含属性克制和本系加成的总倍率
   * 
   * @param petType1 精灵属性1
   * @param petType2 精灵属性2（可选）
   * @param skillType1 技能属性1
   * @param skillType2 技能属性2（可选）
   * @param defType1 防守方属性1
   * @param defType2 防守方属性2（可选）
   * @returns 总伤害倍率
   */
  public static CalculateDamageMultiplier(
    petType1: number,
    petType2: number | undefined,
    skillType1: number,
    skillType2: number | undefined,
    defType1: number,
    defType2: number | undefined
  ): number {
    // 属性克制倍率（使用技能属性攻击防守方属性）
    const effectiveness = this.CalculateEffectiveness(skillType1, skillType2, defType1, defType2);

    // 本系加成倍率
    const stab = this.GetSTABMultiplier(petType1, petType2, skillType1, skillType2);

    return effectiveness * stab;
  }

  // ==================== 辅助方法 ====================

  /**
   * 根据属性名获取属性ID
   * 
   * @param name 属性名称
   * @returns 属性ID，如果未找到则返回undefined
   */
  public static GetTypeByName(name: string): number | undefined {
    this.LoadElementData();

    const type = this.typeDataCache?.find(t => t.name === name);
    return type?.id;
  }

  /**
   * 获取克制效果描述
   * 
   * @param multiplier 克制倍率
   * @returns 效果描述文本
   */
  public static GetEffectivenessText(multiplier: number): string {
    if (multiplier >= 4) {
      return '超级克制';
    } else if (multiplier >= 2) {
      return '克制';
    } else if (multiplier >= 1) {
      return '普通';
    } else if (multiplier > 0) {
      return '微弱';
    } else {
      return '无效';
    }
  }

  /**
   * 获取所有属性类型
   * 
   * @returns 所有属性类型数据
   */
  public static GetAllTypes(): IElementType[] {
    this.LoadElementData();
    return this.typeDataCache || [];
  }

  /**
   * 验证属性ID是否有效
   * 
   * @param typeId 属性ID
   * @returns 是否有效
   */
  public static IsValidType(typeId: number): boolean {
    return typeId >= 1 && typeId <= 26;
  }

  // ==================== 调试方法 ====================

  /**
   * 打印属性克制信息（用于调试）
   * 
   * @param atkType 攻击属性
   * @param defType 防守属性
   */
  public static DebugEffectiveness(atkType: number, defType: number): void {
    const eff = this.GetEffectiveness(atkType, defType);
    const atkName = this.GetTypeName(atkType);
    const defName = this.GetTypeName(defType);
    
    console.log(`[属性] ${atkName} → ${defName}: x${eff.toFixed(2)} (${this.GetEffectivenessText(eff)})`);
  }

  /**
   * 打印所有属性类型（用于调试）
   */
  public static PrintAllTypes(): void {
    console.log('========== 赛尔号属性系统 ==========');
    const types = this.GetAllTypes();
    for (const type of types) {
      console.log(`[${type.id.toString().padStart(2, '0')}] ${type.name} (${type.nameEn})`);
    }
    console.log('====================================');
  }
}
