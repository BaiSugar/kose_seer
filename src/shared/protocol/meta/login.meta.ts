import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * 登录相关命令元数据
 */
export const LoginMetadata: ICommandMeta[] = [
  /**
   * [CMD: MAIN_LOGIN_IN (104)] 主登录
   * 请求: account(64字节) + passwordMD5(32字节) + extra(12字节)
   * 响应: session(16字节) + roleCreated(4字节)
   */
  {
    cmdID: CommandID.MAIN_LOGIN_IN,
    name: 'MAIN_LOGIN_IN',
    desc: '主登录',
    request: [
      { name: 'account', type: 'string', length: 64, desc: '账号' },
      { name: 'passwordMD5', type: 'string', length: 32, desc: '密码MD5' },
      { name: 'extra', type: 'hex', length: 12, desc: '额外数据' }
    ],
    response: [
      { name: 'session', type: 'hex', length: 16, desc: '会话标识' },
      { name: 'roleCreated', type: 'uint32', desc: '是否已创建角色 (1=是, 0=否)' }
    ]
  },

  /**
   * [CMD: LOGIN_IN (1001)] 游戏登录
   * 请求: session(16字节)
   * 响应: 完整的用户登录信息
   */
  {
    cmdID: CommandID.LOGIN_IN,
    name: 'LOGIN_IN',
    desc: '游戏登录',
    request: [
      { name: 'session', type: 'hex', length: 16, desc: '会话标识' }
    ],
    response: [
      { name: 'userID', type: 'uint32', desc: '用户ID' },
      { name: 'regTime', type: 'uint32', desc: '注册时间' },
      { name: 'nick', type: 'string', length: 16, desc: '昵称' },
      { name: 'vipFlags', type: 'uint32', desc: 'VIP标志位 (bit0=vip, bit1=viped)' },
      { name: 'dsFlag', type: 'uint32', desc: 'DS标志' },
      { name: 'color', type: 'uint32', desc: '颜色' },
      { name: 'texture', type: 'uint32', desc: '纹理' },
      { name: 'energy', type: 'uint32', desc: '能量' },
      { name: 'coins', type: 'uint32', desc: '赛尔豆' },
      { name: 'fightBadge', type: 'uint32', desc: '战斗徽章' },
      { name: 'mapID', type: 'uint32', desc: '地图ID' },
      { name: 'posX', type: 'uint32', desc: 'X坐标' },
      { name: 'posY', type: 'uint32', desc: 'Y坐标' },
      { name: 'timeToday', type: 'uint32', desc: '今日在线时间' },
      { name: 'timeLimit', type: 'uint32', desc: '时间限制' },
      { name: 'isClothHalfDay', type: 'uint8', desc: '服装半价' },
      { name: 'isRoomHalfDay', type: 'uint8', desc: '房间半价' },
      { name: 'iFortressHalfDay', type: 'uint8', desc: '堡垒半价' },
      { name: 'isHQHalfDay', type: 'uint8', desc: '总部半价' },
      { name: 'loginCnt', type: 'uint32', desc: '登录次数' },
      { name: 'inviter', type: 'uint32', desc: '邀请者ID' },
      { name: 'newInviteeCnt', type: 'uint32', desc: '新邀请人数' },
      { name: 'vipLevel', type: 'uint32', desc: 'VIP等级' },
      { name: 'vipValue', type: 'uint32', desc: 'VIP值' },
      { name: 'vipStage', type: 'uint32', desc: 'VIP阶段' },
      { name: 'autoCharge', type: 'uint32', desc: '自动充值' },
      { name: 'vipEndTime', type: 'uint32', desc: 'VIP结束时间' },
      { name: 'freshManBonus', type: 'uint32', desc: '新手奖励' },
      { name: 'nonoChipList', type: 'boolarray', length: 80, desc: 'NONO芯片列表(80个布尔值)' },
      { name: 'dailyResArr', type: 'bytearray', length: 50, desc: '每日资源数组(50个数值)' },
      { name: 'teacherID', type: 'uint32', desc: '老师ID' },
      { name: 'studentID', type: 'uint32', desc: '学生ID' },
      { name: 'graduationCount', type: 'uint32', desc: '毕业次数' },
      { name: 'maxPuniLv', type: 'uint32', desc: '最大惩罚等级' },
      { name: 'petMaxLev', type: 'uint32', desc: '精灵最高等级' },
      { name: 'petAllNum', type: 'uint32', desc: '精灵总数' },
      { name: 'monKingWin', type: 'uint32', desc: '怪物王胜利次数' },
      { name: 'curStage', type: 'uint32', desc: '当前关卡' },
      { name: 'maxStage', type: 'uint32', desc: '最大关卡' },
      { name: 'curFreshStage', type: 'uint32', desc: '当前新手关卡' },
      { name: 'maxFreshStage', type: 'uint32', desc: '最大新手关卡' },
      { name: 'maxArenaWins', type: 'uint32', desc: '竞技场最大连胜' },
      { name: 'twoTimes', type: 'uint32', desc: '双倍次数' },
      { name: 'threeTimes', type: 'uint32', desc: '三倍次数' },
      { name: 'autoFight', type: 'uint32', desc: '自动战斗' },
      { name: 'autoFightTimes', type: 'uint32', desc: '自动战斗次数' },
      { name: 'energyTimes', type: 'uint32', desc: '能量次数' },
      { name: 'learnTimes', type: 'uint32', desc: '学习次数' },
      { name: 'monBtlMedal', type: 'uint32', desc: '怪物战斗勋章' },
      { name: 'recordCnt', type: 'uint32', desc: '记录数' },
      { name: 'obtainTm', type: 'uint32', desc: '获取时间' },
      { name: 'soulBeadItemID', type: 'uint32', desc: '魂珠物品ID' },
      { name: 'expireTm', type: 'uint32', desc: '过期时间' },
      { name: 'fuseTimes', type: 'uint32', desc: '融合次数' },
      { name: 'hasNono', type: 'uint32', desc: '是否有NONO(0/1)' },
      { name: 'superNono', type: 'uint32', desc: '是否超级NONO(0/1)' },
      { name: 'nonoState', type: 'uint32', desc: 'NONO状态位图(32位)' },
      { name: 'nonoColor', type: 'uint32', desc: 'NONO颜色' },
      { name: 'nonoNick', type: 'string', length: 16, desc: 'NONO昵称' },
      // TeamInfo (24字节)
      { name: 'teamID', type: 'uint32', desc: '战队ID' },
      { name: 'teamPriv', type: 'uint32', desc: '战队权限' },
      { name: 'teamSuperCore', type: 'uint32', desc: '是否超级核心(0/1)' },
      { name: 'teamIsShow', type: 'uint32', desc: '战队是否显示(0/1)' },
      { name: 'teamAllContribution', type: 'uint32', desc: '战队总贡献' },
      { name: 'teamCanExContribution', type: 'uint32', desc: '战队可兑换贡献' },
      // TeamPKInfo (8字节)
      { name: 'teamPKGroupID', type: 'uint32', desc: '战队PK分组ID' },
      { name: 'teamPKHomeTeamID', type: 'uint32', desc: '战队PK主场战队ID' },
      // 其他字段
      { name: 'reserved1', type: 'uint8', desc: '保留字段1' },
      { name: 'badge', type: 'uint32', desc: '徽章' },
      { name: 'reserved2', type: 'bytearray', length: 27, desc: '保留字段(27个字节)' },
      { name: 'taskList', type: 'bytearray', length: 500, desc: '任务列表(500个任务状态)' },
      { name: 'petNum', type: 'uint32', desc: '背包精灵数量' },
      // 精灵列表 (每个精灵约 140+ 字节)
      {
        name: 'pets',
        type: 'array',
        arrayCountField: 'petNum',
        arrayFields: [
          { name: 'id', type: 'uint32', desc: '精灵ID' },
          { name: 'name', type: 'string', length: 16, desc: '精灵昵称' },
          { name: 'dv', type: 'uint32', desc: '个体值' },
          { name: 'nature', type: 'uint32', desc: '性格' },
          { name: 'level', type: 'uint32', desc: '等级' },
          { name: 'exp', type: 'uint32', desc: '当前经验' },
          { name: 'lvExp', type: 'uint32', desc: '本级经验' },
          { name: 'nextLvExp', type: 'uint32', desc: '下级经验' },
          { name: 'hp', type: 'uint32', desc: '当前HP' },
          { name: 'maxHp', type: 'uint32', desc: '最大HP' },
          { name: 'attack', type: 'uint32', desc: '攻击' },
          { name: 'defence', type: 'uint32', desc: '防御' },
          { name: 'spAttack', type: 'uint32', desc: '特攻' },
          { name: 'spDefence', type: 'uint32', desc: '特防' },
          { name: 'speed', type: 'uint32', desc: '速度' },
          { name: 'evHp', type: 'uint32', desc: '学习力HP' },
          { name: 'evAttack', type: 'uint32', desc: '学习力攻击' },
          { name: 'evDefence', type: 'uint32', desc: '学习力防御' },
          { name: 'evSpAttack', type: 'uint32', desc: '学习力特攻' },
          { name: 'evSpDefence', type: 'uint32', desc: '学习力特防' },
          { name: 'evSpeed', type: 'uint32', desc: '学习力速度' },
          { name: 'skillNum', type: 'uint32', desc: '技能数量' },
          // 技能列表 (固定4个槽位，每个12字节)
          { name: 'skill1Id', type: 'uint32', desc: '技能1 ID' },
          { name: 'skill1PP', type: 'uint32', desc: '技能1 PP' },
          { name: 'skill1MaxPP', type: 'uint32', desc: '技能1 最大PP' },
          { name: 'skill2Id', type: 'uint32', desc: '技能2 ID' },
          { name: 'skill2PP', type: 'uint32', desc: '技能2 PP' },
          { name: 'skill2MaxPP', type: 'uint32', desc: '技能2 最大PP' },
          { name: 'skill3Id', type: 'uint32', desc: '技能3 ID' },
          { name: 'skill3PP', type: 'uint32', desc: '技能3 PP' },
          { name: 'skill3MaxPP', type: 'uint32', desc: '技能3 最大PP' },
          { name: 'skill4Id', type: 'uint32', desc: '技能4 ID' },
          { name: 'skill4PP', type: 'uint32', desc: '技能4 PP' },
          { name: 'skill4MaxPP', type: 'uint32', desc: '技能4 最大PP' },
          { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
          { name: 'catchMap', type: 'uint32', desc: '捕获地图' },
          { name: 'catchRect', type: 'uint32', desc: '捕获区域' },
          { name: 'catchLevel', type: 'uint32', desc: '捕获等级' },
          { name: 'effectCount', type: 'uint16', desc: '效果数量' },
          // 效果列表 (动态，每个效果约8字节)
          { name: 'skinID', type: 'uint32', desc: '皮肤ID' }
        ],
        desc: '精灵列表'
      },
      { name: 'clothCount', type: 'uint32', desc: '装备数量' },
      {
        name: 'clothes',
        type: 'array',
        arrayCountField: 'clothCount',
        arrayFields: [
          { name: 'id', type: 'uint32', desc: '装备ID' },
          { name: 'level', type: 'uint32', desc: '装备等级' }
        ],
        desc: '装备列表'
      },
      { name: 'curTitle', type: 'uint32', desc: '当前称号' },
      { name: 'bossAchievement', type: 'boolarray', length: 200, desc: 'BOSS成就列表(200个布尔值)' }
    ]
  },

  /**
   * [CMD: CREATE_ROLE (108)] 创建角色
   * 请求: userID(4) + nickname(16) + color(4)
   * 响应: session(16字节)
   */
  {
    cmdID: CommandID.CREATE_ROLE,
    name: 'CREATE_ROLE',
    desc: '创建角色',
    request: [
      { name: 'userID', type: 'uint32', desc: '用户ID' },
      { name: 'nickname', type: 'string', length: 16, desc: '昵称' },
      { name: 'color', type: 'uint32', desc: '颜色' }
    ],
    response: [
      { name: 'session', type: 'hex', length: 16, desc: '会话标识' }
    ]
  }
];
