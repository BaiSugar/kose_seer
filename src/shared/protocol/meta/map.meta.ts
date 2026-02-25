import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * map 模块协议元数据
 */
export const mapMeta: ICommandMeta[] = [
  /**
   * 进入地图请求
   */
  {
    cmdID: CommandID.ENTER_MAP,
    name: 'ENTER_MAP',
    desc: '进入地图',
    request: [
      { name: 'mapType', type: 'uint32', desc: '地图类型' },
      { name: 'mapId', type: 'uint32', desc: '地图ID' },
      { name: 'x', type: 'uint32', desc: 'X坐标' },
      { name: 'y', type: 'uint32', desc: 'Y坐标' }
    ],
    response: [
      { name: 'sysTime', type: 'uint32', desc: '系统时间' },
      { name: 'userID', type: 'uint32', desc: '用户ID' },
      { name: 'nick', type: 'string', length: 16, desc: '昵称' },
      { name: 'color', type: 'uint32', desc: '颜色' },
      { name: 'texture', type: 'uint32', desc: '纹理' },
      { name: 'vipFlags', type: 'uint32', desc: 'VIP标志 (bit 0=vip, bit 1=viped)' },
      { name: 'vipStage', type: 'uint32', desc: 'VIP阶段' },
      { name: 'actionType', type: 'uint32', desc: '动作类型 (0=正常, 1=飞行)' },
      { name: 'x', type: 'uint32', desc: 'X坐标' },
      { name: 'y', type: 'uint32', desc: 'Y坐标' },
      { name: 'action', type: 'uint32', desc: '动作' },
      { name: 'direction', type: 'uint32', desc: '方向' },
      { name: 'changeShape', type: 'uint32', desc: '变身' },
      { name: 'spiritTime', type: 'uint32', desc: '精灵捕获时间' },
      { name: 'spiritID', type: 'uint32', desc: '精灵ID' },
      { name: 'petDV', type: 'uint32', desc: '精灵DV值' },
      { name: 'petSkin', type: 'uint32', desc: '精灵皮肤' },
      { name: 'fightFlag', type: 'uint32', desc: '战斗标志' },
      { name: 'teacherID', type: 'uint32', desc: '师傅ID' },
      { name: 'studentID', type: 'uint32', desc: '徒弟ID' },
      { name: 'nonoState', type: 'uint32', desc: 'NoNo状态位图' },
      { name: 'nonoColor', type: 'uint32', desc: 'NoNo颜色' },
      { name: 'superNono', type: 'uint32', desc: '超级NoNo (0/1)' },
      { name: 'playerForm', type: 'uint32', desc: '玩家形态' },
      { name: 'transTime', type: 'uint32', desc: '变身时间' },
      { name: 'teamId', type: 'uint32', desc: '战队ID' },
      { name: 'teamCoreCount', type: 'uint32', desc: '战队核心数' },
      { name: 'teamIsShow', type: 'uint32', desc: '战队是否显示' },
      { name: 'teamLogoBg', type: 'uint32', desc: '战队Logo背景' },
      { name: 'teamLogoIcon', type: 'uint32', desc: '战队Logo图标' },
      { name: 'teamLogoColor', type: 'uint32', desc: '战队Logo颜色' },
      { name: 'teamTxtColor', type: 'uint32', desc: '战队文字颜色' },
      { name: 'teamLogoWord', type: 'string', length: 4, desc: '战队Logo文字' },
      { name: 'clothCount', type: 'uint32', desc: '服装数量' },
      {
        name: 'clothes',
        type: 'array',
        arrayCountField: 'clothCount',
        arrayFields: [
          { name: 'id', type: 'uint32', desc: '服装ID' },
          { name: 'level', type: 'uint32', desc: '服装等级' }
        ],
        desc: '服装列表'
      },
      { name: 'curTitle', type: 'uint32', desc: '当前称号' }
    ]
  },
  /**
   * 离开地图
   */
  {
    cmdID: CommandID.LEAVE_MAP,
    name: 'LEAVE_MAP',
    desc: '离开地图',
    request: [
      { name: 'mapId', type: 'uint32', desc: '地图ID' },
      { name: 'mapType', type: 'uint32', desc: '地图类型' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' }
    ]
  },
  /**
   * 地图玩家列表响应
   */
  {
    cmdID: CommandID.LIST_MAP_PLAYER,
    name: 'LIST_MAP_PLAYER',
    desc: '地图玩家列表',
    request: [],
    response: [
      { name: 'playerCount', type: 'uint32', desc: '玩家数量' },
      {
        name: 'players',
        type: 'array',
        arrayCountField: 'playerCount',
        arrayFields: [
          { name: 'sysTime', type: 'uint32', desc: '系统时间' },
          { name: 'userID', type: 'uint32', desc: '用户ID' },
          { name: 'nick', type: 'string', length: 16, desc: '昵称' },
          { name: 'color', type: 'uint32', desc: '颜色' },
          { name: 'texture', type: 'uint32', desc: '纹理' },
          { name: 'vipFlags', type: 'uint32', desc: 'VIP标志' },
          { name: 'vipStage', type: 'uint32', desc: 'VIP阶段' },
          { name: 'actionType', type: 'uint32', desc: '动作类型' },
          { name: 'x', type: 'uint32', desc: 'X坐标' },
          { name: 'y', type: 'uint32', desc: 'Y坐标' },
          { name: 'action', type: 'uint32', desc: '动作' },
          { name: 'direction', type: 'uint32', desc: '方向' },
          { name: 'changeShape', type: 'uint32', desc: '变身' },
          { name: 'spiritTime', type: 'uint32', desc: '精灵捕获时间' },
          { name: 'spiritID', type: 'uint32', desc: '精灵ID' },
          { name: 'petDV', type: 'uint32', desc: '精灵DV值' },
          { name: 'petSkin', type: 'uint32', desc: '精灵皮肤' },
          { name: 'fightFlag', type: 'uint32', desc: '战斗标志' },
          { name: 'teacherID', type: 'uint32', desc: '师傅ID' },
          { name: 'studentID', type: 'uint32', desc: '徒弟ID' },
          { name: 'nonoState', type: 'uint32', desc: 'NoNo状态' },
          { name: 'nonoColor', type: 'uint32', desc: 'NoNo颜色' },
          { name: 'superNono', type: 'uint32', desc: '超级NoNo' },
          { name: 'playerForm', type: 'uint32', desc: '玩家形态' },
          { name: 'transTime', type: 'uint32', desc: '变身时间' },
          { name: 'teamId', type: 'uint32', desc: '战队ID' },
          { name: 'teamCoreCount', type: 'uint32', desc: '战队核心数' },
          { name: 'teamIsShow', type: 'uint32', desc: '战队是否显示' },
          { name: 'teamLogoBg', type: 'uint32', desc: '战队Logo背景' },
          { name: 'teamLogoIcon', type: 'uint32', desc: '战队Logo图标' },
          { name: 'teamLogoColor', type: 'uint32', desc: '战队Logo颜色' },
          { name: 'teamTxtColor', type: 'uint32', desc: '战队文字颜色' },
          { name: 'teamLogoWord', type: 'string', length: 4, desc: '战队Logo文字' },
          { name: 'clothCount', type: 'uint32', desc: '服装数量' },
          {
            name: 'clothes',
            type: 'array',
            arrayCountField: 'clothCount',
            arrayFields: [
              { name: 'id', type: 'uint32', desc: '服装ID' },
              { name: 'level', type: 'uint32', desc: '服装等级' }
            ],
            desc: '服装列表'
          },
          { name: 'curTitle', type: 'uint32', desc: '当前称号' }
        ],
        desc: '玩家列表'
      }
    ]
  },
  /**
   * 地图野怪列表响应
   */
  {
    cmdID: CommandID.MAP_OGRE_LIST,
    name: 'MAP_OGRE_LIST',
    desc: '地图野怪列表',
    request: [],
    response: [
      { name: 'ogres', type: 'array', desc: '9个槽位的野怪信息' }
    ]
  },
  /**
   * 地图BOSS列表响应
   */
  {
    cmdID: CommandID.MAP_BOSS,
    name: 'MAP_BOSS',
    desc: '地图BOSS列表',
    request: [],
    response: [
      { name: 'bossCount', type: 'uint32', desc: 'BOSS数量' },
      { name: 'bosses', type: 'array', desc: 'BOSS列表' }
    ]
  },
  /**
   * 获取简单用户信息
   */
  {
    cmdID: CommandID.GET_SIM_USERINFO,
    name: 'GET_SIM_USERINFO',
    desc: '获取简单用户信息',
    request: [
      { name: 'targetId', type: 'uint32', desc: '目标用户ID' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'nick', type: 'string', length: 16, desc: '昵称' },
      { name: 'color', type: 'uint32', desc: '颜色' },
      { name: 'texture', type: 'uint32', desc: '纹理' },
      { name: 'vip', type: 'uint32', desc: 'VIP标志' },
      { name: 'status', type: 'uint32', desc: '在线状态' },
      { name: 'mapType', type: 'uint32', desc: '地图类型' },
      { name: 'mapId', type: 'uint32', desc: '地图ID' },
      { name: 'isCanBeTeacher', type: 'uint32', desc: '是否可以当老师' },
      { name: 'teacherID', type: 'uint32', desc: '老师ID' },
      { name: 'studentID', type: 'uint32', desc: '学生ID' },
      { name: 'graduationCount', type: 'uint32', desc: '毕业次数' },
      { name: 'vipLevel', type: 'uint32', desc: 'VIP等级' },
      { name: 'teamId', type: 'uint32', desc: '战队ID' },
      { name: 'teamIsShow', type: 'uint32', desc: '战队是否显示' },
      { name: 'clothCount', type: 'uint32', desc: '服装数量' },
      {
        name: 'clothes',
        type: 'array',
        arrayCountField: 'clothCount',
        arrayFields: [
          { name: 'id', type: 'uint32', desc: '服装ID' },
          { name: 'level', type: 'uint32', desc: '服装等级' }
        ],
        desc: '服装列表'
      }
    ]
  },
  /**
   * 获取详细用户信息
   */
  {
    cmdID: CommandID.GET_MORE_USERINFO,
    name: 'GET_MORE_USERINFO',
    desc: '获取详细用户信息',
    request: [
      { name: 'targetId', type: 'uint32', desc: '目标用户ID' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'nick', type: 'string', length: 16, desc: '昵称' },
      { name: 'regTime', type: 'uint32', desc: '注册时间' },
      { name: 'petAllNum', type: 'uint32', desc: '精灵总数' },
      { name: 'petMaxLev', type: 'uint32', desc: '精灵最高等级' },
      { name: 'bossAchievement', type: 'string', length: 200, desc: 'BOSS成就' },
      { name: 'graduationCount', type: 'uint32', desc: '毕业次数' },
      { name: 'monKingWin', type: 'uint32', desc: '怪物王胜利次数' },
      { name: 'messWin', type: 'uint32', desc: '混战胜利次数' },
      { name: 'maxStage', type: 'uint32', desc: '最大关卡' },
      { name: 'maxArenaWins', type: 'uint32', desc: '竞技场最大连胜' },
      { name: 'curTitle', type: 'uint32', desc: '当前称号' }
    ]
  },
  /**
   * 修改昵称
   */
  {
    cmdID: CommandID.CHANG_NICK_NAME,
    name: 'CHANG_NICK_NAME',
    desc: '修改昵称',
    request: [
      { name: 'newNick', type: 'string', length: 16, desc: '新昵称' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'newNick', type: 'string', length: 16, desc: '新昵称' }
    ]
  },
  /**
   * 修改颜色
   */
  {
    cmdID: CommandID.CHANGE_COLOR,
    name: 'CHANGE_COLOR',
    desc: '修改颜色',
    request: [
      { name: 'newColor', type: 'uint32', desc: '新颜色' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'newColor', type: 'uint32', desc: '新颜色' },
      { name: 'cost', type: 'uint32', desc: '花费' },
      { name: 'remain', type: 'uint32', desc: '剩余货币' }
    ]
  },
  /**
   * 玩家移动请求
   */
  {
    cmdID: CommandID.PEOPLE_WALK,
    name: 'PEOPLE_WALK',
    desc: '玩家移动',
    request: [
      { name: 'walkType', type: 'uint32', desc: '移动类型' },
      { name: 'x', type: 'uint32', desc: 'X坐标' },
      { name: 'y', type: 'uint32', desc: 'Y坐标' },
      { name: 'amfLen', type: 'uint32', desc: 'AMF数据长度' },
      { name: 'amfData', type: 'bytes', desc: 'AMF数据' }
    ],
    response: [
      { name: 'walkType', type: 'uint32', desc: '移动类型' },
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'x', type: 'uint32', desc: 'X坐标' },
      { name: 'y', type: 'uint32', desc: 'Y坐标' },
      { name: 'amfData', type: 'bytes', desc: 'AMF数据' }
    ]
  },
  /**
   * 聊天
   */
  {
    cmdID: CommandID.CHAT,
    name: 'CHAT',
    desc: '聊天',
    request: [
      { name: 'chatType', type: 'uint32', desc: '聊天类型' },
      { name: 'msgLen', type: 'uint32', desc: '消息长度' },
      { name: 'msg', type: 'string', lengthField: 'msgLen', desc: '消息内容' }
    ],
    response: [
      { name: 'senderId', type: 'uint32', desc: '发送者ID' },
      { name: 'senderNick', type: 'string', length: 16, desc: '发送者昵称' },
      { name: 'toId', type: 'uint32', desc: '接收者ID (0=公共聊天)' },
      { name: 'msgLen', type: 'uint32', desc: '消息长度' },
      { name: 'msg', type: 'string', lengthField: 'msgLen', desc: '消息内容' }
    ]
  },
  /**
   * 舞蹈动作
   */
  {
    cmdID: CommandID.DANCE_ACTION,
    name: 'DANCE_ACTION',
    desc: '舞蹈动作',
    request: [
      { name: 'actionId', type: 'uint32', desc: '动作ID' },
      { name: 'actionType', type: 'uint32', desc: '动作类型' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'actionId', type: 'uint32', desc: '动作ID' },
      { name: 'actionType', type: 'uint32', desc: '动作类型' }
    ]
  },
  /**
   * 瞄准/交互
   */
  {
    cmdID: CommandID.AIMAT,
    name: 'AIMAT',
    desc: '瞄准/交互',
    request: [
      { name: 'targetType', type: 'uint32', desc: '目标类型' },
      { name: 'targetId', type: 'uint32', desc: '目标ID' },
      { name: 'x', type: 'uint32', desc: 'X坐标' },
      { name: 'y', type: 'uint32', desc: 'Y坐标' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'targetType', type: 'uint32', desc: '目标类型' },
      { name: 'targetId', type: 'uint32', desc: '目标ID' }
    ]
  },
  /**
   * 玩家变身
   */
  {
    cmdID: CommandID.PEOPLE_TRANSFROM,
    name: 'PEOPLE_TRANSFROM',
    desc: '玩家变身',
    request: [
      { name: 'transId', type: 'uint32', desc: '变身ID' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'transId', type: 'uint32', desc: '变身ID' }
    ]
  },
  /**
   * 开关飞行模式
   */
  {
    cmdID: CommandID.ON_OR_OFF_FLYING,
    name: 'ON_OR_OFF_FLYING',
    desc: '开关飞行模式',
    request: [
      { name: 'flyMode', type: 'uint32', desc: '飞行模式 (0=关闭, 1=开启)' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'flyMode', type: 'uint32', desc: '飞行模式' }
    ]
  }
];
