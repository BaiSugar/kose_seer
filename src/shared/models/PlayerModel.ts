/**
 * 玩家数据模型
 * 基于客户端 UserInfo.as 结构定义
 */

// ============================================================================
// 账号相关模型
// ============================================================================

/**
 * 账号状态枚举
 */
export enum AccountStatus {
  NORMAL = 0,           // 正常
  BANNED = 1,           // 封禁
  FROZEN = 2,           // 冻结
  PENDING = 3           // 待激活
}

/**
 * 账号信息 (用于注册和登录)
 */
export interface IAccountInfo {
  id: number;               // 账号ID (米米号)
  email: string;            // 邮箱地址
  passwordHash: string;     // 密码哈希 (MD5或其他)
  status: AccountStatus;    // 账号状态
  createTime: number;       // 创建时间 (时间戳)
  lastLoginTime: number;    // 最后登录时间
  lastLoginIP: string;      // 最后登录IP
  roleCreated: boolean;     // 是否已创建角色
}

/**
 * Session信息 (用于登录会话管理)
 */
export interface ISessionInfo {
  sessionKey: string;       // 会话密钥 (16字节hex)
  accountId: number;        // 账号ID
  createTime: number;       // 创建时间
  expireTime: number;       // 过期时间
  loginIP: string;          // 登录IP
  serverId: number;         // 当前服务器ID
  isOnline: boolean;        // 是否在线
}

/**
 * 登录请求信息
 */
export interface ILoginRequest {
  account: string;          // 账号 (邮箱或米米号)
  passwordMD5: string;      // 密码MD5
}

/**
 * 登录响应信息
 */
export interface ILoginResponse {
  success: boolean;         // 是否成功
  sessionKey: string;       // 会话密钥 (16字节)
  roleCreated: boolean;     // 是否已创建角色
  accountId: number;        // 账号ID
  errorCode?: number;       // 错误码
  errorMsg?: string;        // 错误信息
}

/**
 * 注册请求信息
 */
export interface IRegisterRequest {
  email: string;            // 邮箱地址
  password: string;         // 密码
  emailCode: string;        // 邮箱验证码
  emailCodeRes: string;     // 服务器验证码响应
}

/**
 * 注册响应信息
 */
export interface IRegisterResponse {
  success: boolean;         // 是否成功
  accountId: number;        // 新账号ID (米米号)
  errorCode?: number;       // 错误码
  errorMsg?: string;        // 错误信息
}

/**
 * 邮箱验证码信息
 */
export interface IEmailCodeInfo {
  email: string;            // 邮箱地址
  code: string;             // 验证码
  codeRes: string;          // 验证码响应 (用于验证)
  createTime: number;       // 创建时间
  expireTime: number;       // 过期时间
  used: boolean;            // 是否已使用
}

/**
 * 创建默认账号信息
 */
export function createDefaultAccountInfo(id: number, email: string, passwordHash: string): IAccountInfo {
  const now = Math.floor(Date.now() / 1000);
  return {
    id,
    email,
    passwordHash,
    status: AccountStatus.NORMAL,
    createTime: now,
    lastLoginTime: 0,
    lastLoginIP: '',
    roleCreated: false
  };
}

/**
 * 创建Session信息
 */
export function createSessionInfo(accountId: number, loginIP: string, expireSeconds: number = 3600): ISessionInfo {
  const now = Math.floor(Date.now() / 1000);
  // 生成16字节的随机session key
  const sessionKey = generateSessionKey();
  return {
    sessionKey,
    accountId,
    createTime: now,
    expireTime: now + expireSeconds,
    loginIP,
    serverId: 0,
    isOnline: false
  };
}

/**
 * 生成Session Key (16字节hex字符串)
 */
export function generateSessionKey(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

/**
 * 生成邮箱验证码
 */
export function generateEmailCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 创建邮箱验证码信息
 */
export function createEmailCodeInfo(email: string, expireSeconds: number = 300): IEmailCodeInfo {
  const now = Math.floor(Date.now() / 1000);
  const code = generateEmailCode();
  // 生成验证码响应 (用于后续验证)
  const codeRes = generateSessionKey().substring(0, 32);
  return {
    email,
    code,
    codeRes,
    createTime: now,
    expireTime: now + expireSeconds,
    used: false
  };
}

// ============================================================================
// 精灵相关模型
// ============================================================================

/**
 * 精灵技能信息
 */
export interface IPetSkillInfo {
  id: number;           // 技能ID
  pp: number;           // 当前PP值
}

/**
 * 精灵效果信息 (20字节)
 */
export interface IPetEffectInfo {
  itemId: number;       // 物品ID
  status: number;       // 状态
  leftCount: number;    // 剩余次数
  effectID: number;     // 效果ID
  param1: number;       // 参数1
  param2: number;       // 参数2
}

/**
 * 精灵完整信息
 */
export interface IPetInfo {
  id: number;           // 精灵ID
  name: string;         // 精灵名称 (16字节)
  dv: number;           // DV值(个体值)
  nature: number;       // 性格
  level: number;        // 等级
  exp: number;          // 当前经验
  lvExp: number;        // 当前等级所需经验
  nextLvExp: number;    // 下一等级所需经验
  hp: number;           // 当前HP
  maxHp: number;        // 最大HP
  attack: number;       // 攻击
  defence: number;      // 防御
  s_a: number;          // 特攻
  s_d: number;          // 特防
  speed: number;        // 速度
  ev_hp: number;        // HP努力值
  ev_attack: number;    // 攻击努力值
  ev_defence: number;   // 防御努力值
  ev_sa: number;        // 特攻努力值
  ev_sd: number;        // 特防努力值
  ev_sp: number;        // 速度努力值
  skillNum: number;     // 技能数量
  skills: IPetSkillInfo[];  // 技能列表 (固定4个槽位)
  catchTime: number;    // 捕获时间戳
  catchMap: number;     // 捕获地图ID
  catchRect: number;    // 捕获区域
  catchLevel: number;   // 捕获时等级
  effectCount: number;  // 效果数量
  effects: IPetEffectInfo[];  // 效果列表
  skinID: number;       // 皮肤ID
  isDefault: boolean;   // 是否首发
}

/**
 * 装备信息 (8字节)
 */
export interface IClothInfo {
  id: number;           // 装备ID
  level: number;        // 装备等级
}

/**
 * 战队信息 (用于登录)
 */
export interface ITeamInfo {
  id: number;           // 战队ID
  level: number;        // 战队等级
  priv: number;         // 权限
  superCore: boolean;   // 是否超级核心
  coreCount: number;    // 核心数量
  isShow: boolean;      // 是否显示
  logoBg: number;       // 徽标背景
  logoIcon: number;     // 徽标图标
  logoColor: number;    // 徽标颜色
  txtColor: number;     // 文字颜色
  logoWord: string;     // 徽标文字 (4字节)
  allContribution: number;    // 总贡献
  canExContribution: number;  // 可兑换贡献
}

/**
 * 战队PK信息
 */
export interface ITeamPKInfo {
  groupID: number;      // 分组ID
  homeTeamID: number;   // 主场战队ID
}

/**
 * 玩家完整信息 (用于登录响应)
 * 对应客户端 UserInfo.setForLoginInfo
 */
export interface IPlayerInfo {
  // ============ 基本信息 ============
  userID: number;           // 用户ID
  regTime: number;          // 注册时间
  nick: string;             // 昵称 (16字节)
  vip: number;              // VIP标志 (bit0)
  viped: number;            // 曾经VIP标志 (bit1)
  dsFlag: number;           // DS标志
  color: number;            // 颜色
  texture: number;          // 纹理

  // ============ 货币信息 ============
  energy: number;           // 能量
  coins: number;            // 赛尔豆
  fightBadge: number;       // 战斗徽章

  // ============ 精灵分配仪 ============
  allocatableExp?: number;  // 可分配经验值

  // ============ 位置信息 ============
  mapID: number;            // 地图ID
  posX: number;             // X坐标
  posY: number;             // Y坐标

  // ============ 时间信息 ============
  timeToday: number;        // 今日在线时间
  timeLimit: number;        // 时间限制

  // ============ 半价标志 ============
  isClothHalfDay: boolean;  // 服装半价
  isRoomHalfDay: boolean;   // 房间半价
  iFortressHalfDay: boolean; // 堡垒半价
  isHQHalfDay: boolean;     // 总部半价

  // ============ 登录信息 ============
  loginCnt: number;         // 登录次数
  inviter: number;          // 邀请者ID
  newInviteeCnt: number;    // 新邀请人数

  // ============ VIP信息 ============
  vipLevel: number;         // VIP等级
  vipValue: number;         // VIP值
  vipStage: number;         // VIP阶段
  autoCharge: number;       // 自动充值
  vipEndTime: number;       // VIP结束时间
  freshManBonus: number;    // 新手奖励

  // ============ NONO芯片 ============
  nonoChipList: number[];   // NONO芯片列表 (80个)

  // ============ 每日资源 ============
  dailyResArr: number[];    // 每日资源数组 (50个)

  // ============ 师徒信息 ============
  teacherID: number;        // 老师ID
  studentID: number;        // 学生ID
  graduationCount: number;  // 毕业次数
  maxPuniLv: number;        // 最大惩罚等级

  // ============ 精灵统计 ============
  petMaxLev: number;        // 精灵最高等级
  petAllNum: number;        // 精灵总数

  // ============ 战斗统计 ============
  monKingWin: number;       // 怪物王胜利次数
  curStage: number;         // 当前关卡
  maxStage: number;         // 最大关卡
  curFreshStage: number;    // 当前新手关卡
  maxFreshStage: number;    // 最大新手关卡
  maxArenaWins: number;     // 竞技场最大连胜

  // ============ 倍率信息 ============
  twoTimes: number;         // 双倍次数
  threeTimes: number;       // 三倍次数
  autoFight: number;        // 自动战斗
  autoFightTimes: number;   // 自动战斗次数
  energyTimes: number;      // 能量次数
  learnTimes: number;       // 学习次数
  monBtlMedal: number;      // 怪物战斗勋章

  // ============ 魂珠信息 ============
  recordCnt: number;        // 记录数
  obtainTm: number;         // 获取时间
  soulBeadItemID: number;   // 魂珠物品ID
  expireTm: number;         // 过期时间
  fuseTimes: number;        // 融合次数

  // ============ NONO信息（对齐官方字段）============
  hasNono: boolean;         // 是否有NONO
  superNono: boolean;       // 是否超级NONO
  nonoState: number;        // NONO状态位图 (32位)
  nonoColor: number;        // NONO颜色
  nonoNick: string;         // NONO昵称 (16字节)
  nonoFlag: number;         // NONO标志
  nonoPower: number;        // NONO体力
  nonoMate: number;         // NONO心情
  nonoIq: number;           // NONO智商
  nonoAi: number;           // NONO AI (2字节)
  nonoBirth: number;        // NONO出生时间
  nonoChargeTime: number;   // NONO充电时间
  // func字段（160位）在数据库中不存储，默认全部开启
  nonoSuperEnergy: number;  // NONO超能能量
  nonoSuperLevel: number;   // NONO超能等级
  nonoSuperStage: number;   // NONO超能阶段

  // ============ 战队信息 ============
  teamInfo: ITeamInfo;      // 战队信息
  teamPKInfo: ITeamPKInfo;  // 战队PK信息

  // ============ 其他信息 ============
  badge: number;            // 徽章
  taskList: number[];       // 任务列表 (500个)

  // ============ 精灵列表 ============
  petNum: number;           // 背包精灵数量
  pets: IPetInfo[];         // 精灵列表

  // ============ 装备列表 ============
  clothCount: number;       // 装备数量
  clothes: IClothInfo[];    // 装备列表

  // ============ 成就信息 ============
  curTitle: number;         // 当前称号
  bossAchievement: boolean[]; // BOSS成就列表 (200个)
}

/**
 * 场景玩家信息 (用于地图玩家列表)
 * 对应客户端 UserInfo.setForPeoleInfo
 */
export interface IScenePlayerInfo {
  sysTime: number;          // 系统时间
  userID: number;           // 用户ID
  nick: string;             // 昵称 (16字节)
  color: number;            // 颜色
  texture: number;          // 纹理
  vip: number;              // VIP标志 (bit0)
  viped: number;            // 曾经VIP标志 (bit1)
  vipStage: number;         // VIP阶段
  actionType: number;       // 动作类型
  posX: number;             // X坐标
  posY: number;             // Y坐标
  action: number;           // 动作
  direction: number;        // 方向
  changeShape: number;      // 变形
  spiritTime: number;       // 精灵时间
  spiritID: number;         // 精灵ID
  petDV: number;            // 精灵DV
  petSkin: number;          // 精灵皮肤
  fightFlag: number;        // 战斗标志
  teacherID: number;        // 老师ID
  studentID: number;        // 学生ID
  nonoState: number;        // NONO状态位图 (32位)
  nonoColor: number;        // NONO颜色
  superNono: boolean;       // 是否超级NONO
  playerForm: boolean;      // 玩家形态
  transTime: number;        // 变形时间

  // 战队简略信息
  teamID: number;           // 战队ID
  teamCoreCount: number;    // 战队核心数量
  teamIsShow: boolean;      // 战队是否显示
  teamLogoBg: number;       // 战队徽标背景
  teamLogoIcon: number;     // 战队徽标图标
  teamLogoColor: number;    // 战队徽标颜色
  teamTxtColor: number;     // 战队文字颜色
  teamLogoWord: string;     // 战队徽标文字 (4字节)

  // 装备列表
  clothCount: number;       // 装备数量
  clothes: IClothInfo[];    // 装备列表

  curTitle: number;         // 当前称号
}

/**
 * 简略用户信息 (用于好友列表等)
 * 对应客户端 UserInfo.setForSimpleInfo
 */
export interface ISimpleUserInfo {
  userID: number;           // 用户ID
  nick: string;             // 昵称 (16字节)
  color: number;            // 颜色
  texture: number;          // 纹理
  vip: number;              // VIP标志
  status: number;           // 状态
  mapType: number;          // 地图类型
  mapID: number;            // 地图ID
  isCanBeTeacher: boolean;  // 是否可当老师
  teacherID: number;        // 老师ID
  studentID: number;        // 学生ID
  graduationCount: number;  // 毕业次数
  vipLevel: number;         // VIP等级
  teamID: number;           // 战队ID
  teamIsShow: boolean;      // 战队是否显示
  clothCount: number;       // 装备数量
  clothes: IClothInfo[];    // 装备列表
}

/**
 * 详细用户信息 (用于查看他人资料)
 * 对应客户端 UserInfo.setForMoreInfo
 */
export interface IDetailUserInfo {
  userID: number;           // 用户ID
  nick: string;             // 昵称 (16字节)
  regTime: number;          // 注册时间
  petAllNum: number;        // 精灵总数
  petMaxLev: number;        // 精灵最高等级
  bossAchievement: boolean[]; // BOSS成就列表 (200个)
  graduationCount: number;  // 毕业次数
  monKingWin: number;       // 怪物王胜利次数
  messWin: number;          // 乱斗胜利次数
  maxStage: number;         // 最大关卡
  maxArenaWins: number;     // 竞技场最大连胜
  curTitle: number;         // 当前称号
}

/**
 * 创建默认的战队信息
 */
export function createDefaultTeamInfo(): ITeamInfo {
  return {
    id: 0,
    level: 0,
    priv: 0,
    superCore: false,
    coreCount: 0,
    isShow: false,
    logoBg: 0,
    logoIcon: 0,
    logoColor: 0,
    txtColor: 0,
    logoWord: '',
    allContribution: 0,
    canExContribution: 0
  };
}

/**
 * 创建默认的战队PK信息
 */
export function createDefaultTeamPKInfo(): ITeamPKInfo {
  return {
    groupID: 0,
    homeTeamID: 0
  };
}

/**
 * 创建默认的精灵技能
 */
export function createDefaultPetSkill(): IPetSkillInfo {
  return {
    id: 0,
    pp: 0
  };
}

/**
 * 创建默认的精灵信息
 */
export function createDefaultPetInfo(): IPetInfo {
  return {
    id: 0,
    name: '',
    dv: 0,
    nature: 0,
    level: 1,
    exp: 0,
    lvExp: 0,
    nextLvExp: 100,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defence: 10,
    s_a: 10,
    s_d: 10,
    speed: 10,
    ev_hp: 0,
    ev_attack: 0,
    ev_defence: 0,
    ev_sa: 0,
    ev_sd: 0,
    ev_sp: 0,
    skillNum: 0,
    skills: [
      createDefaultPetSkill(),
      createDefaultPetSkill(),
      createDefaultPetSkill(),
      createDefaultPetSkill()
    ],
    catchTime: 0,
    catchMap: 0,
    catchRect: 0,
    catchLevel: 1,
    effectCount: 0,
    effects: [],
    skinID: 0,
    isDefault: false
  };
}

/**
 * 创建默认的玩家信息
 */
export function createDefaultPlayerInfo(userID: number, nick: string): IPlayerInfo {
  return {
    userID,
    regTime: Math.floor(Date.now() / 1000),
    nick,
    vip: 0,
    viped: 0,
    dsFlag: 0,
    color: 0,
    texture: 0,
    energy: 100,
    coins: 1000,
    fightBadge: 0,
    mapID: 1,
    posX: 300,
    posY: 300,
    timeToday: 0,
    timeLimit: 0,
    isClothHalfDay: false,
    isRoomHalfDay: false,
    iFortressHalfDay: false,
    isHQHalfDay: false,
    loginCnt: 0,  // 0 for first login to trigger novice rewards
    inviter: 0,
    newInviteeCnt: 0,
    vipLevel: 0,
    vipValue: 0,
    vipStage: 1,
    autoCharge: 0,
    vipEndTime: 0,
    freshManBonus: 0,
    nonoChipList: new Array(80).fill(0),
    dailyResArr: new Array(50).fill(0),
    teacherID: 0,
    studentID: 0,
    graduationCount: 0,
    maxPuniLv: 0,
    petMaxLev: 0,
    petAllNum: 0,
    monKingWin: 0,
    curStage: 1,
    maxStage: 0,
    curFreshStage: 0,
    maxFreshStage: 0,
    maxArenaWins: 0,
    twoTimes: 0,
    threeTimes: 0,
    autoFight: 0,
    autoFightTimes: 0,
    energyTimes: 0,
    learnTimes: 0,
    monBtlMedal: 0,
    recordCnt: 0,
    obtainTm: 0,
    soulBeadItemID: 0,
    expireTm: 0,
    fuseTimes: 0,
    hasNono: true,
    superNono: false,
    nonoState: 0,
    nonoColor: 0xFFFFFF,
    nonoNick: 'NoNo',
    nonoFlag: 1,
    nonoPower: 10000,
    nonoMate: 10000,
    nonoIq: 0,
    nonoAi: 0,
    nonoBirth: Math.floor(Date.now() / 1000),
    nonoChargeTime: 500,
    nonoSuperEnergy: 0,
    nonoSuperLevel: 0,
    nonoSuperStage: 0,
    teamInfo: createDefaultTeamInfo(),
    teamPKInfo: createDefaultTeamPKInfo(),
    badge: 0,
    taskList: new Array(500).fill(0),
    petNum: 0,
    pets: [],
    clothCount: 0,
    clothes: [],
    curTitle: 0,
    bossAchievement: new Array(200).fill(false)
  };
}
