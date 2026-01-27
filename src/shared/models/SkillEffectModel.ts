/**
 * 技能效果数据模型
 */

/**
 * 技能效果配置（从 XML 加载）
 */
export interface ISkillEffectConfig {
  id: number;              // 效果索引 (Idx)
  eid: number;             // 效果类型 (Eid)
  stat: number;            // 效果状态 (0=无效, 1=永久, 2=有限次)
  times: number;           // 可用次数 (当 stat=2 时有效)
  args: string;            // 效果参数字符串
  desc?: string;           // 效果描述
  desc2?: string;          // 效果描述2
  itemId?: number;         // 关联道具ID
}

/**
 * 技能效果类型枚举
 * 根据 luvit/luvit_version/game/seer_skill_effects.lua 定义
 */
export enum SkillEffectType {
  NONE = 0,                    // 无效果
  ABSORB = 1,                  // 吸血效果
  STAT_DOWN = 2,               // 降低对方能力等级
  STAT_UP = 3,                 // 提升自身能力等级
  STAT_UP_2 = 4,               // 提升自身能力等级2
  STAT_DOWN_2 = 5,             // 降低对方能力等级2
  RECOIL = 6,                  // 反伤（自身受伤）
  HP_EQUAL = 7,                // 同生共死
  MERCY = 8,                   // 手下留情
  RAGE = 9,                    // 愤怒
  PARALYSIS = 10,              // 麻痹
  BIND = 11,                   // 束缚
  BURN = 12,                   // 烧伤
  POISON = 13,                 // 中毒
  BIND_2 = 14,                 // 束缚2
  FLINCH = 15,                 // 畏缩
  FREEZE = 16,                 // 冻伤（未在Lua中实现）
  SLEEP = 17,                  // 睡眠（未在Lua中实现）
  FEAR = 18,                   // 害怕（未在Lua中实现）
  CONFUSION = 19,              // 混乱（未在Lua中实现）
  FATIGUE = 20,                // 疲惫
  // 21-28 未定义
  FLINCH_2 = 29,               // 畏缩2（变体）
  // 30 未定义
  MULTI_HIT = 31,              // 连续攻击
  // 32 未定义
  PP_REDUCE = 33,              // 消化不良（减少PP）
  ENCORE = 34,                 // 克制（强制重复技能）
  PUNISHMENT = 35              // 惩罚（根据对方能力提升增加伤害）
  // 36-40+ 未定义或未实现
}

/**
 * 战斗属性枚举
 */
export enum BattleAttr {
  HP = 0,
  ATK = 1,
  DEF = 2,
  SP_ATK = 3,
  SP_DEF = 4,
  SPEED = 5
}

/**
 * 战斗等级枚举（能力等级）
 */
export enum BattleLevel {
  ATK = 0,
  DEF = 1,
  SP_ATK = 2,
  SP_DEF = 3,
  SPEED = 4,
  ACCURACY = 5
}

/**
 * 异常状态枚举
 */
export enum AbnormalStatus {
  PARALYSIS = 0,    // 麻痹
  POISONED = 1,     // 中毒
  BURNING = 2,      // 灼烧
  FROSTED = 5,      // 冰冻
  FRIGHTENED = 6,   // 害怕
  SLEEP = 8         // 睡眠
}

/**
 * 技能效果结果
 */
export interface ISkillEffectResult {
  type: string;           // 效果类型 (heal, damage, stat_change, status, etc.)
  target: string;         // 目标 (attacker, defender)
  amount?: number;        // 数值
  stat?: BattleAttr;      // 属性
  level?: BattleLevel;    // 等级
  status?: AbnormalStatus;// 异常状态
  success: boolean;       // 是否成功
  message?: string;       // 效果描述
}

/**
 * 解析效果参数字符串
 * @param argsStr 参数字符串 (格式: "arg1 arg2 arg3" 或 "arg1,arg2")
 */
export function parseEffectArgs(argsStr: string): number[] {
  if (!argsStr || argsStr.trim() === '') return [];
  
  const args: number[] = [];
  const matches = argsStr.match(/(-?\d+)/g);
  
  if (matches) {
    for (const match of matches) {
      args.push(parseInt(match));
    }
  }
  
  return args;
}
