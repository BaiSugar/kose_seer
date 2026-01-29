import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * 社交模块元数据
 * 包含好友、邮件、NONO等命令
 */
export const SocialMetadata: ICommandMeta[] = [
  // ============ 好友系统 ============
  {
    cmdID: CommandID.GET_RELATION_LIST,
    name: 'GET_RELATION_LIST',
    desc: '获取好友列表',
    request: [],
    response: [
      { name: 'friendCount', type: 'uint32', desc: '好友数量' },
      {
        name: 'friends',
        type: 'array',
        arrayCountField: 'friendCount',
        arrayFields: [
          { name: 'userID', type: 'uint32', desc: '用户ID' },
          { name: 'nick', type: 'string', length: 16, desc: '昵称' },
          { name: 'color', type: 'uint32', desc: '颜色' },
          { name: 'texture', type: 'uint32', desc: '纹理' },
          { name: 'vip', type: 'uint32', desc: 'VIP标志' },
          { name: 'status', type: 'uint32', desc: '在线状态' },
          { name: 'mapType', type: 'uint32', desc: '地图类型' },
          { name: 'mapID', type: 'uint32', desc: '地图ID' },
          { name: 'isCanBeTeacher', type: 'uint32', desc: '是否可以当老师' },
          { name: 'teacherID', type: 'uint32', desc: '老师ID' },
          { name: 'studentID', type: 'uint32', desc: '学生ID' },
          { name: 'graduationCount', type: 'uint32', desc: '毕业次数' },
          { name: 'vipLevel', type: 'uint32', desc: 'VIP等级' },
          { name: 'teamID', type: 'uint32', desc: '战队ID' },
          { name: 'teamIsShow', type: 'uint32', desc: '战队是否显示' },
          { name: 'clothCount', type: 'uint32', desc: '服装数量' },
          {
            name: 'clothes',
            type: 'array',
            arrayCountField: 'clothCount',
            arrayFields: [
              { name: 'clothId', type: 'uint32', desc: '服装ID' },
              { name: 'clothLevel', type: 'uint32', desc: '服装等级' }
            ],
            desc: '服装列表'
          }
        ],
        desc: '好友列表'
      }
    ]
  },

  // ============ 邮件系统 ============
  {
    cmdID: CommandID.MAIL_GET_UNREAD,
    name: 'MAIL_GET_UNREAD',
    desc: '获取未读邮件数量',
    request: [],
    response: [
      { name: 'unreadCount', type: 'uint32', desc: '未读邮件数量' }
    ]
  },
  {
    cmdID: CommandID.MAIL_GET_LIST,
    name: 'MAIL_GET_LIST',
    desc: '获取邮件列表',
    request: [
      { name: 'page', type: 'uint32', desc: '页码(从1开始)' }
    ],
    response: [
      { name: 'total', type: 'uint32', desc: '邮件总数' },
      { name: 'mailCount', type: 'uint32', desc: '当前页邮件数量' },
      {
        name: 'mails',
        type: 'array',
        arrayCountField: 'mailCount',
        arrayFields: [
          { name: 'id', type: 'uint32', desc: '邮件ID' },
          { name: 'template', type: 'uint32', desc: '模板ID' },
          { name: 'time', type: 'uint32', desc: '时间戳' },
          { name: 'fromID', type: 'uint32', desc: '发送者ID' },
          { name: 'fromNick', type: 'string', length: 16, desc: '发送者昵称' },
          { name: 'flag', type: 'uint32', desc: '标志(0=未读, 1=已读)' }
        ],
        desc: '邮件列表'
      }
    ]
  },
  {
    cmdID: CommandID.MAIL_GET_CONTENT,
    name: 'MAIL_GET_CONTENT',
    desc: '获取邮件内容',
    request: [
      { name: 'mailId', type: 'uint32', desc: '邮件ID' }
    ],
    response: [
      { name: 'mailId', type: 'uint32', desc: '邮件ID' },
      { name: 'template', type: 'uint32', desc: '模板ID' },
      { name: 'time', type: 'uint32', desc: '时间戳' },
      { name: 'fromID', type: 'uint32', desc: '发送者ID' },
      { name: 'fromNick', type: 'string', length: 16, desc: '发送者昵称' },
      { name: 'flag', type: 'uint32', desc: '标志(0=未读, 1=已读)' },
      { name: 'contentLen', type: 'uint32', desc: '内容长度' },
      { name: 'content', type: 'string', lengthField: 'contentLen', desc: '邮件内容' }
    ]
  },

  // ============ 兑换系统 ============
  {
    cmdID: CommandID.GET_EXCHANGE_INFO,
    name: 'GET_EXCHANGE_INFO',
    desc: '获取兑换信息',
    request: [],
    response: [
      { name: 'exchangeCount', type: 'uint32', desc: '兑换项数量' },
      {
        name: 'exchanges',
        type: 'array',
        arrayCountField: 'exchangeCount',
        arrayFields: [
          { name: 'exchangeID', type: 'uint32', desc: '兑换ID' },
          { name: 'exchangeNum', type: 'uint32', desc: '已兑换次数' }
        ],
        desc: '兑换列表'
      }
    ]
  },

  // ============ 魂珠系统 ============
  {
    cmdID: CommandID.GET_SOUL_BEAD_List,
    name: 'GET_SOUL_BEAD_List',
    desc: '获取魂珠列表',
    request: [],
    response: [
      { name: 'soulBeadCount', type: 'uint32', desc: '魂珠数量' },
      {
        name: 'soulBeads',
        type: 'array',
        arrayCountField: 'soulBeadCount',
        arrayFields: [
          { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
          { name: 'itemID', type: 'uint32', desc: '物品ID' },
          { name: 'obtainTime', type: 'uint32', desc: '获得时间' }
        ],
        desc: '魂珠列表'
      }
    ]
  },

  // ============ 心跳 ============
  {
    cmdID: CommandID.NIEO_HEART,
    name: 'NIEO_HEART',
    desc: '心跳包',
    request: [],
    response: []
  }
];
