/**
 * 技能数据模型
 */

/**
 * 技能信息接口
 */
export interface ISkillInfo {
  id: number;              // 技能ID
  name: string;            // 技能名称
  category: number;        // 技能类别 (1=物理, 2=特殊, 3=变化)
  type: number;            // 属性类型 (0-17)
  power: number;           // 威力
  pp: number;              // 当前PP
  maxPP: number;           // 最大PP
  accuracy: number;        // 命中率 (0-100)
  critRate: number;        // 暴击率倍率
  priority: number;        // 优先度
  mustHit: boolean;        // 是否必中
  sideEffect?: number;     // 副作用ID
  sideEffectArg?: string;  // 副作用参数
}

/**
 * 精灵技能槽
 */
export interface IPetSkill {
  skillId: number;         // 技能ID
  pp: number;              // 当前PP
  maxPP: number;           // 最大PP
}

/**
 * 技能配置（从配置文件加载）
 */
export interface ISkillConfig {
  id: number;
  name: string;
  category: number;
  type: number;
  power: number;
  maxPP: number;
  accuracy: number;
  critRate: number;
  priority: number;
  mustHit: boolean;
  sideEffect?: number;
  sideEffectArg?: string;
  
  // 特殊暴击条件
  critAtkFirst?: boolean;    // 先出手必暴击
  critAtkSecond?: boolean;   // 后出手必暴击
  critSelfHalfHp?: boolean;  // 自身HP低于一半必暴击
  critFoeHalfHp?: boolean;   // 对方HP低于一半必暴击
}

/**
 * 创建默认技能
 */
export function createDefaultSkill(skillId: number): IPetSkill {
  return {
    skillId,
    pp: 20,
    maxPP: 20
  };
}

/**
 * 技能类别枚举
 */
export enum SkillCategory {
  PHYSICAL = 1,    // 物理
  SPECIAL = 2,     // 特殊
  STATUS = 3       // 变化
}

/**
 * 属性类型枚举
 */
export enum ElementType {
  NORMAL = 0,      // 普通
  FIRE = 1,        // 火
  WATER = 2,       // 水
  GRASS = 3,       // 草
  ELECTRIC = 4,    // 电
  ICE = 5,         // 冰
  FIGHTING = 6,    // 格斗
  POISON = 7,      // 毒
  GROUND = 8,      // 地面
  FLYING = 9,      // 飞行
  PSYCHIC = 10,    // 超能
  BUG = 11,        // 虫
  ROCK = 12,       // 岩石
  GHOST = 13,      // 幽灵
  DRAGON = 14,     // 龙
  DARK = 15,       // 暗
  STEEL = 16,      // 钢
  LIGHT = 17       // 光
}
