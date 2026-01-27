/**
 * 战斗数据模型
 * 存储战斗状态、参战精灵信息、回合数据等
 */

/**
 * 战斗状态枚举
 */
export enum BattleStatus {
  NONE = -1,           // 无状态
  PARALYSIS = 0,       // 麻痹
  POISON = 1,          // 中毒
  BURN = 2,            // 烧伤
  DRAIN = 3,           // 吸取对方体力
  DRAINED = 4,         // 被对方吸取体力
  FREEZE = 5,          // 冻伤
  FEAR = 6,            // 害怕
  FATIGUE = 7,         // 疲惫
  SLEEP = 8,           // 睡眠
  PETRIFY = 9,         // 石化
  CONFUSION = 10,      // 混乱
  WEAKNESS = 11,       // 衰弱
  MOUNTAIN_GUARD = 12, // 山神守护
  FLAMMABLE = 13,      // 易燃
  RAGE = 14,           // 狂暴
  ICE_SEAL = 15,       // 冰封
  BLEED = 16,          // 流血
  IMMUNE_DOWN = 17,    // 免疫能力下降
  IMMUNE_STATUS = 18   // 免疫异常状态
}

/**
 * 战斗中的精灵信息
 */
export interface IBattlePet {
  id: number;              // 精灵ID
  petId: number;           // 精灵模板ID
  name: string;            // 精灵名称
  level: number;           // 等级
  hp: number;              // 当前HP
  maxHp: number;           // 最大HP
  attack: number;          // 攻击
  defence: number;         // 防御
  spAtk: number;           // 特攻
  spDef: number;           // 特防
  speed: number;           // 速度
  type: number;            // 属性类型
  skills: number[];        // 技能列表
  catchTime: number;       // 捕获时间
  statusArray: number[];   // 状态数组(20字节) - 用于协议传输
  battleLv: number[];      // 战斗等级(6字节)
  
  // 效果系统支持
  battleLevels?: number[]; // 能力等级修正 (-6 到 +6) [ATK, DEF, SP_ATK, SP_DEF, SPEED, ACCURACY]
  effectCounters?: { [key: string]: number }; // 效果计数器
  
  // 状态效果字段
  status?: BattleStatus;   // 当前主要异常状态（单个，用于显示）
  statusTurns?: number;    // 状态持续回合数
  statusDurations?: number[]; // 所有状态的持续时间数组（20个元素，对应BattleStatus枚举）
  flinched?: boolean;      // 是否畏缩
  bound?: boolean;         // 是否被束缚
  boundTurns?: number;     // 束缚剩余回合数
  fatigue?: boolean;       // 是否疲惫
  fatigueTurns?: number;   // 疲惫剩余回合数
  
  // 特殊效果字段
  lastMove?: number;       // 上次使用的技能ID
  skillPP?: number[];      // 技能PP数组
  encore?: boolean;        // 是否被克制
  encoreTurns?: number;    // 克制剩余回合数
}

/**
 * 攻击结果
 */
export interface IAttackResult {
  userId: number;          // 攻击者ID
  skillId: number;         // 技能ID
  atkTimes: number;        // 攻击次数
  damage: number;          // 伤害值
  gainHp: number;          // 回复HP
  attackerRemainHp: number; // 攻击者剩余HP
  attackerMaxHp: number;   // 攻击者最大HP
  missed: boolean;         // 是否未命中
  blocked: boolean;        // 是否被格挡
  isCrit: boolean;         // 是否暴击
  attackerStatus: number[]; // 攻击者状态
  attackerBattleLv: number[]; // 攻击者战斗等级
}

/**
 * 回合结果
 */
export interface ITurnResult {
  firstAttack?: IAttackResult;  // 先手攻击
  secondAttack?: IAttackResult; // 后手攻击
  isOver: boolean;              // 战斗是否结束
  winner?: number;              // 胜利者ID (0=敌人)
  reason?: number;              // 结束原因 (0=正常, 1=逃跑, 2=捕获)
}

/**
 * 战斗信息
 */
export interface IBattleInfo {
  userId: number;          // 玩家ID
  player: IBattlePet;      // 玩家精灵
  enemy: IBattlePet;       // 敌人精灵
  turn: number;            // 当前回合数
  isOver: boolean;         // 是否结束
  winner?: number;         // 胜利者
  aiType?: string;         // AI类型
  startTime: number;       // 开始时间
}
