/**
 * 精灵属性计算系统
 * 负责计算精灵的各项属性值（HP、攻击、防御、特攻、特防、速度）
 * 
 * 移植自: luvit/luvit_version/game/seer_pet_calculator.lua
 * 
 * 计算公式：
 * - HP = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 等级 + 10
 * - 其他属性 = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 5
 * 
 * 性格修正：
 * - 增益属性：x1.1
 * - 减益属性：x0.9
 * - 平衡型：x1.0
 */

import { GameConfig } from '../../../shared/config/game/GameConfig';
import { NatureSystem, StatType } from '../Battle/NatureSystem';
import { Logger } from '../../../shared/utils';
import { IPetInfo } from '../../../shared/models/PetModel';

/**
 * 精灵种族值接口
 */
export interface IPetBaseStats {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  spd: number;
}

/**
 * 精灵计算属性接口
 */
export interface IPetCalculatedStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  speed: number;
  lvExp: number;        // 当前等级已获得的经验
  nextLvExp: number;    // 升级所需经验
}

/**
 * 精灵属性计算器
 */
export class PetCalculator {

  /**
   * 获取精灵的种族值
   * 
   * @param petId 精灵种类ID
   * @returns 种族值数据
   */
  private static GetBaseStats(petId: number): IPetBaseStats | null {
    const petConfig = GameConfig.GetPetById(petId);
    if (!petConfig) {
      Logger.Warn(`[PetCalculator] 精灵配置不存在: PetId=${petId}`);
      return null;
    }

    return {
      hp: petConfig.HP || 50,
      atk: petConfig.Atk || 50,
      def: petConfig.Def || 50,
      spAtk: petConfig.SpAtk || 50,
      spDef: petConfig.SpDef || 50,
      spd: petConfig.Spd || 50
    };
  }

  /**
   * 计算精灵的 HP
   * 
   * 公式: HP = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 等级 + 10
   * 
   * @param petId 精灵种类ID
   * @param level 等级
   * @param dv 个体值 (0-31)
   * @param ev 努力值 (0-255)
   * @returns HP值
   */
  public static CalculateHP(
    petId: number,
    level: number,
    dv: number = 31,
    ev: number = 0
  ): number {
    const baseStats = this.GetBaseStats(petId);
    if (!baseStats) {
      return 100; // 默认值
    }

    const raceValue = baseStats.hp;
    const hp = Math.floor((raceValue * 2 + dv + ev / 4) * level / 100) + level + 10;
    
    return Math.max(1, hp); // 确保至少为1
  }

  /**
   * 计算精灵的其他属性（攻击、防御、特攻、特防、速度）
   * 
   * 公式: 属性 = floor((种族值 * 2 + 个体值 + 努力值 / 4) * 等级 / 100) + 5
   * 
   * @param petId 精灵种类ID
   * @param statName 属性名称 ('atk', 'def', 'spAtk', 'spDef', 'speed')
   * @param level 等级
   * @param dv 个体值 (0-31)
   * @param ev 努力值 (0-255)
   * @param nature 性格ID (0-25)
   * @returns 属性值
   */
  public static CalculateStat(
    petId: number,
    statName: 'atk' | 'def' | 'spAtk' | 'spDef' | 'speed',
    level: number,
    dv: number = 31,
    ev: number = 0,
    nature: number = 0
  ): number {
    const baseStats = this.GetBaseStats(petId);
    if (!baseStats) {
      return 50; // 默认值
    }

    // 映射属性名到种族值字段名
    const statFieldMap: { [key: string]: keyof IPetBaseStats } = {
      'atk': 'atk',
      'def': 'def',
      'spAtk': 'spAtk',
      'spDef': 'spDef',
      'speed': 'spd'  // 注意：speed 映射到 spd
    };

    // 获取种族值
    const fieldName = statFieldMap[statName];
    const raceValue = baseStats[fieldName];

    // 基础计算
    let stat = Math.floor((raceValue * 2 + dv + ev / 4) * level / 100) + 5;

    // 应用性格修正
    if (nature > 0 && nature <= 26) {
      // 映射属性名到 StatType
      const statTypeMap: { [key: string]: StatType } = {
        'atk': StatType.ATTACK,
        'def': StatType.DEFENCE,
        'spAtk': StatType.SP_ATTACK,
        'spDef': StatType.SP_DEFENCE,
        'speed': StatType.SPEED
      };

      const statType = statTypeMap[statName];
      if (statType) {
        const natureMultiplier = NatureSystem.GetStatModifier(nature, statType);
        stat = Math.floor(stat * natureMultiplier);
      }
    }

    return Math.max(1, stat); // 确保至少为1
  }

  /**
   * 计算精灵的当前等级经验值
   * 
   * 简化实现：使用固定的经验曲线
   * 等级 N 所需总经验 = N^3
   * 
   * @param level 当前等级
   * @param exp 总经验值
   * @returns { lvExp: 当前等级已获得的经验, nextLvExp: 升级所需经验 }
   */
  public static CalculateLevelExp(
    level: number,
    exp: number
  ): { lvExp: number; nextLvExp: number } {
    // 等级 N 所需总经验 = N^3
    const totalExpForLevel = level * level * level;
    const totalExpForNextLevel = (level + 1) * (level + 1) * (level + 1);

    // 当前等级已获得的经验
    let lvExp = exp - totalExpForLevel;
    if (lvExp < 0) {
      lvExp = 0;
    }

    // 升级所需经验
    const nextLvExp = totalExpForNextLevel - totalExpForLevel;

    return { lvExp, nextLvExp };
  }

  /**
   * 计算升到指定等级所需的经验
   * 使用立方公式：level^3 * 成长系数
   * 
   * 成长类型：
   * - 0: 快速成长 (0.8x)
   * - 1: 中速成长 (1.0x)
   * - 2: 慢速成长 (1.2x)
   * - 3: 极慢成长 (1.5x)
   * 
   * @param level 目标等级
   * @param petId 精灵ID（可选，用于获取成长类型）
   * @returns 升到该等级所需的经验
   */
  public static CalculateExpForLevel(level: number, petId?: number): number {
    let growthMultiplier = 1.0; // 默认中速成长
    
    if (petId) {
      const petConfig = GameConfig.GetPetById(petId);
      if (petConfig && petConfig.GrowthType !== undefined) {
        const growthType = petConfig.GrowthType;
        
        switch (growthType) {
          case 0:
            growthMultiplier = 0.8; // 快速成长
            break;
          case 1:
            growthMultiplier = 1.0; // 中速成长
            break;
          case 2:
            growthMultiplier = 1.2; // 慢速成长
            break;
          case 3:
            growthMultiplier = 1.5; // 极慢成长
            break;
          default:
            growthMultiplier = 1.0; // 默认中速
        }
      }
    }
    
    return Math.floor(level * level * level * growthMultiplier);
  }

  /**
   * 计算精灵的所有属性
   * 
   * @param petId 精灵种类ID
   * @param level 等级
   * @param exp 总经验值
   * @param nature 性格ID
   * @param dvs 个体值对象
   * @param evs 努力值对象
   * @param currentHp 当前HP（可选，默认为满血）
   * @returns 计算后的所有属性
   */
  public static CalculateAllStats(
    petId: number,
    level: number,
    exp: number,
    nature: number,
    dvs: {
      hp: number;
      atk: number;
      def: number;
      spAtk: number;
      spDef: number;
      speed: number;
    },
    evs: {
      hp: number;
      atk: number;
      def: number;
      spAtk: number;
      spDef: number;
      speed: number;
    },
    currentHp?: number
  ): IPetCalculatedStats {
    // 计算各项属性
    const maxHp = this.CalculateHP(petId, level, dvs.hp, evs.hp);
    const atk = this.CalculateStat(petId, 'atk', level, dvs.atk, evs.atk, nature);
    const def = this.CalculateStat(petId, 'def', level, dvs.def, evs.def, nature);
    const spAtk = this.CalculateStat(petId, 'spAtk', level, dvs.spAtk, evs.spAtk, nature);
    const spDef = this.CalculateStat(petId, 'spDef', level, dvs.spDef, evs.spDef, nature);
    const speed = this.CalculateStat(petId, 'speed', level, dvs.speed, evs.speed, nature);

    // 当前 HP（默认为满血）
    let hp = currentHp !== undefined ? currentHp : maxHp;
    if (hp > maxHp) {
      hp = maxHp;
    }
    if (hp < 0) {
      hp = 0;
    }

    // 计算经验值
    const { lvExp, nextLvExp } = this.CalculateLevelExp(level, exp);

    return {
      hp,
      maxHp,
      atk,
      def,
      spAtk,
      spDef,
      speed,
      lvExp,
      nextLvExp
    };
  }

  /**
   * 从精灵数据计算所有属性（便捷方法）
   * 
   * @param pet 精灵数据
   * @returns 计算后的所有属性
   */
  public static CalculateStatsFromPet(pet: IPetInfo): IPetCalculatedStats {
    return this.CalculateAllStats(
      pet.petId,
      pet.level,
      pet.exp,
      pet.nature,
      {
        hp: pet.dvHp,
        atk: pet.dvAtk,
        def: pet.dvDef,
        spAtk: pet.dvSpAtk,
        spDef: pet.dvSpDef,
        speed: pet.dvSpeed
      },
      {
        hp: pet.evHp,
        atk: pet.evAtk,
        def: pet.evDef,
        spAtk: pet.evSpAtk,
        spDef: pet.evSpDef,
        speed: pet.evSpeed
      },
      pet.hp
    );
  }

  /**
   * 更新精灵的计算属性
   * 
   * 将计算后的属性应用到精灵数据对象上
   * 
   * @param pet 精灵数据（会被修改）
   * @returns 更新后的精灵数据
   */
  public static UpdatePetStats(pet: IPetInfo): IPetInfo {
    const stats = this.CalculateStatsFromPet(pet);

    pet.hp = stats.hp;
    pet.maxHp = stats.maxHp;
    pet.atk = stats.atk;
    pet.def = stats.def;
    pet.spAtk = stats.spAtk;
    pet.spDef = stats.spDef;
    pet.speed = stats.speed;

    return pet;
  }

  /**
   * 计算升级所需的总经验
   * 
   * @param targetLevel 目标等级
   * @returns 所需总经验
   */
  public static CalculateTotalExpForLevel(targetLevel: number): number {
    return targetLevel * targetLevel * targetLevel;
  }

  /**
   * 根据经验值计算等级
   * 
   * @param exp 总经验值
   * @returns 等级
   */
  public static CalculateLevelFromExp(exp: number): number {
    // 使用二分查找或直接计算
    // 由于 exp = level^3，所以 level = exp^(1/3)
    let level = Math.floor(Math.pow(exp, 1 / 3));
    
    // 确保等级至少为1
    if (level < 1) {
      level = 1;
    }

    // 验证并调整
    while (this.CalculateTotalExpForLevel(level + 1) <= exp) {
      level++;
    }

    return level;
  }

  /**
   * 检查精灵是否可以升级
   * 
   * @param level 当前等级
   * @param exp 总经验值
   * @param maxLevel 最大等级（默认100）
   * @returns 是否可以升级
   */
  public static CanLevelUp(level: number, exp: number, maxLevel: number = 100): boolean {
    if (level >= maxLevel) {
      return false;
    }

    const requiredExp = this.CalculateTotalExpForLevel(level + 1);
    return exp >= requiredExp;
  }

  /**
   * 计算精灵升级后的新等级
   * 
   * @param currentLevel 当前等级
   * @param exp 总经验值
   * @param maxLevel 最大等级（默认100）
   * @returns 新等级
   */
  public static CalculateNewLevel(
    currentLevel: number,
    exp: number,
    maxLevel: number = 100
  ): number {
    let newLevel = this.CalculateLevelFromExp(exp);
    
    // 限制最大等级
    if (newLevel > maxLevel) {
      newLevel = maxLevel;
    }

    // 确保不会降级
    if (newLevel < currentLevel) {
      newLevel = currentLevel;
    }

    return newLevel;
  }

  /**
   * 添加经验值并计算新等级
   * 
   * @param pet 精灵数据（会被修改）
   * @param expGain 获得的经验值
   * @param maxLevel 最大等级（默认100）
   * @returns { leveledUp: 是否升级, oldLevel: 旧等级, newLevel: 新等级 }
   */
  public static AddExperience(
    pet: IPetInfo,
    expGain: number,
    maxLevel: number = 100
  ): { leveledUp: boolean; oldLevel: number; newLevel: number } {
    const oldLevel = pet.level;
    pet.exp += expGain;

    // 计算新等级
    const newLevel = this.CalculateNewLevel(oldLevel, pet.exp, maxLevel);
    pet.level = newLevel;

    // 如果升级了，重新计算属性
    if (newLevel > oldLevel) {
      this.UpdatePetStats(pet);
      Logger.Info(`[PetCalculator] 精灵升级: PetId=${pet.id}, ${oldLevel} -> ${newLevel}`);
    }

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel
    };
  }

  /**
   * 验证个体值是否有效
   * 
   * @param dv 个体值
   * @returns 是否有效
   */
  public static IsValidDV(dv: number): boolean {
    return dv >= 0 && dv <= 31;
  }

  /**
   * 验证努力值是否有效
   * 
   * @param ev 努力值
   * @returns 是否有效
   */
  public static IsValidEV(ev: number): boolean {
    return ev >= 0 && ev <= 255;
  }

  /**
   * 验证努力值总和是否有效
   * 
   * 赛尔号的努力值总和限制为510
   * 
   * @param evs 努力值对象
   * @returns 是否有效
   */
  public static IsValidEVTotal(evs: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
  }): boolean {
    const total = evs.hp + evs.atk + evs.def + evs.spAtk + evs.spDef + evs.speed;
    return total <= 510;
  }

  /**
   * 生成随机个体值
   * 
   * @returns 随机个体值对象
   */
  public static GenerateRandomDVs(): {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
  } {
    return {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spAtk: Math.floor(Math.random() * 32),
      spDef: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32)
    };
  }

  /**
   * 生成随机性格
   * 
   * @returns 随机性格ID (1-26)
   */
  public static GenerateRandomNature(): number {
    return Math.floor(Math.random() * 26) + 1;
  }
}
