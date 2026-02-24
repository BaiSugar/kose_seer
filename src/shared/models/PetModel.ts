/**
 * 精灵特性信息接口
 * 参考客户端 PetEffectInfo.as
 */
export interface IPetEffectInfo {
  itemId: number;                // 特性物品ID
  status: number;                // 特性状态（2=已激活）
  leftCount: number;             // 剩余使用次数
  effectID: number;              // 特性ID
  args: string;                  // 参数字符串
}

/**
 * 精灵信息接口
 */
export interface IPetInfo {
  id: number;                    // 精灵唯一ID（数据库自增ID）
  userId: number;                // 所属玩家ID
  catchTime: number;             // 捕获时间
  petId: number;                 // 精灵种类ID
  level: number;                 // 等级
  exp: number;                   // 经验值
  hp: number;                    // 当前HP
  maxHp: number;                 // 最大HP
  atk: number;                   // 攻击
  def: number;                   // 防御
  spAtk: number;                 // 特攻
  spDef: number;                 // 特防
  speed: number;                 // 速度
  evHp: number;                  // HP努力值
  evAtk: number;                 // 攻击努力值
  evDef: number;                 // 防御努力值
  evSpAtk: number;               // 特攻努力值
  evSpDef: number;               // 特防努力值
  evSpeed: number;               // 速度努力值
  dvHp: number;                  // HP个体值
  dvAtk: number;                 // 攻击个体值
  dvDef: number;                 // 防御个体值
  dvSpAtk: number;               // 特攻个体值
  dvSpDef: number;               // 特防个体值
  dvSpeed: number;               // 速度个体值
  nature: number;                // 性格
  skillArray: number[];          // 技能列表
  effectList: IPetEffectInfo[];  // 特性列表
  isDefault: boolean;            // 是否首发
  isInBag: boolean;              // 是否在背包（false=在仓库）
  position: number;              // 背包位置
  nick: string;                  // 昵称
  obtainTime: number;            // 获得时间
  obtainWay: number;             // 获得方式
  obtainLevel: number;           // 获得时等级
  effectCount: number;           // 特效计数
  commonMark: number;            // 通用标记
  skinId?: number;               // 皮肤ID（可选）
  shiny?: number;                // 异色方案ID（0=普通，1+=异色方案编号）
}

/**
 * 创建默认精灵信息
 */
export function createDefaultPetInfo(userId: number, petId: number): IPetInfo {
  const now = Math.floor(Date.now() / 1000);
  
  // 创建基础精灵对象
  const pet: IPetInfo = {
    id: 0,
    userId,
    catchTime: now,
    petId,
    level: 1,
    exp: 0,
    hp: 20,        // 临时值，稍后会被 PetCalculator 重新计算
    maxHp: 20,     // 临时值，稍后会被 PetCalculator 重新计算
    atk: 10,       // 临时值，稍后会被 PetCalculator 重新计算
    def: 10,       // 临时值，稍后会被 PetCalculator 重新计算
    spAtk: 10,     // 临时值，稍后会被 PetCalculator 重新计算
    spDef: 10,     // 临时值，稍后会被 PetCalculator 重新计算
    speed: 10,     // 临时值，稍后会被 PetCalculator 重新计算
    evHp: 0,
    evAtk: 0,
    evDef: 0,
    evSpAtk: 0,
    evSpDef: 0,
    evSpeed: 0,
    dvHp: Math.floor(Math.random() * 32),      // 0-31
    dvAtk: Math.floor(Math.random() * 32),     // 0-31
    dvDef: Math.floor(Math.random() * 32),     // 0-31
    dvSpAtk: Math.floor(Math.random() * 32),   // 0-31
    dvSpDef: Math.floor(Math.random() * 32),   // 0-31
    dvSpeed: Math.floor(Math.random() * 32),   // 0-31
    nature: Math.floor(Math.random() * 25),     // 0-24（性格ID范围）
    skillArray: [],
    effectList: [],
    isDefault: false,
    isInBag: true,
    position: 0,
    nick: '',
    obtainTime: now,
    obtainWay: 0,
    obtainLevel: 1,
    effectCount: 0,
    commonMark: 0,
    shiny: 0  // 默认普通精灵
  };
  
  // 注意：属性值应该在调用此函数后，由 PetCalculator.UpdatePetStats(pet) 重新计算
  // 这里的临时值只是为了确保对象结构完整
  
  return pet;
}
