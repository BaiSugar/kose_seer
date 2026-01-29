/**
 * NoNo 模块元数据
 * 包含 NoNo 相关的所有命令元数据定义
 */
import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

export const NoNoModuleMetadata: ICommandMeta[] = [
  {
    cmdID: CommandID.NONO_FOLLOW_OR_HOOM,
    name: 'NONO_FOLLOW_OR_HOOM',
    desc: 'NoNo 跟随或回家',
    request: [
      { name: 'action', type: 'uint32', desc: '操作 (0=回家, 1=跟随)' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '玩家用户ID' },
      { name: 'superStage', type: 'uint32', desc: 'NoNo超能阶段 (0-5)' },
      { name: 'state', type: 'uint32', desc: '跟随状态 (0=回家, 1=跟随)' },
      // 以下字段仅在 state=1 (跟随) 时返回
      { name: 'nick', type: 'string', length: 16, desc: 'NoNo昵称 (仅跟随时)' },
      { name: 'color', type: 'uint32', desc: 'NoNo颜色 (仅跟随时)' },
      { name: 'power', type: 'uint32', desc: 'NoNo体力值 (需除以1000, 仅跟随时)' }
    ]
  },
  {
    cmdID: CommandID.NONO_INFO,
    name: 'NONO_INFO',
    desc: '获取NONO信息',
    request: [
      { name: 'userID', type: 'uint32', desc: '用户ID' }
    ],
    response: [
      { name: 'userID', type: 'uint32', desc: '用户ID' },
      { name: 'flag', type: 'uint32', desc: 'NONO标志位(32位)' },
      { name: 'state', type: 'uint32', desc: 'NONO状态位(32位)' },
      { name: 'nick', type: 'string', length: 16, desc: 'NONO昵称' },
      { name: 'superNono', type: 'uint32', desc: '是否超级NONO' },
      { name: 'color', type: 'uint32', desc: 'NONO颜色' },
      { name: 'power', type: 'uint32', desc: '体力值(实际值*1000)' },
      { name: 'mate', type: 'uint32', desc: '亲密度(实际值*1000)' },
      { name: 'iq', type: 'uint32', desc: '智商' },
      { name: 'ai', type: 'uint16', desc: 'AI等级' },
      { name: 'birth', type: 'uint32', desc: '出生时间(秒)' },
      { name: 'chargeTime', type: 'uint32', desc: '充值时间' },
      { name: 'func', type: 'bitarray', length: 20, desc: '功能位图(20字节,每字节8位=160个布尔值)' },
      { name: 'superEnergy', type: 'uint32', desc: '超能量' },
      { name: 'superLevel', type: 'uint32', desc: '超级等级' },
      { name: 'superStage', type: 'uint32', desc: '超级阶段' }
    ]
  },

  {
    cmdID: CommandID.NONO_CHANGE_NAME,
    name: 'NONO_CHANGE_NICK',
    desc: '修改 NoNo 昵称',
    request: [
      { name: 'nick', type: 'string', length: 16, desc: '新昵称' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.NONO_CHANGE_COLOR,
    name: 'NONO_CHANGE_COLOR',
    desc: '修改 NoNo 颜色',
    request: [
      { name: 'color', type: 'uint32', desc: '新颜色' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.NONO_OPEN_SUPER,
    name: 'NONO_OPEN_SUPER',
    desc: '开启超级 NoNo',
    request: [
      { name: 'level', type: 'uint32', desc: '超能等级' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.NONO_HELP_EXP,
    name: 'NONO_HELP_EXP',
    desc: 'NoNo 帮助获得经验',
    request: [
      { name: 'petCatchTime', type: 'uint32', desc: '精灵捕获时间' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' },
      { name: 'exp', type: 'uint32', desc: '获得的经验值' }
    ]
  },
  {
    cmdID: CommandID.NONO_START_EXE,
    name: 'NONO_START_EXE',
    desc: 'NoNo 开始执行任务',
    request: [
      { name: 'taskId', type: 'uint32', desc: '任务ID' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' },
      { name: 'taskId', type: 'uint32', desc: '任务ID' },
      { name: 'endTime', type: 'uint32', desc: '结束时间 (Unix时间戳)' }
    ]
  },
  {
    cmdID: CommandID.NONO_END_EXE,
    name: 'NONO_END_EXE',
    desc: 'NoNo 结束执行任务',
    request: [
      { name: 'taskId', type: 'uint32', desc: '任务ID' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' },
      { name: 'taskId', type: 'uint32', desc: '任务ID' },
      { name: 'rewardType', type: 'uint32', desc: '奖励类型' },
      { name: 'rewardValue', type: 'uint32', desc: '奖励值' }
    ]
  },
  {
    cmdID: CommandID.NONO_EXE_LIST,
    name: 'NONO_EXE_LIST',
    desc: '获取 NoNo 执行任务列表',
    request: [],
    response: [
      { name: 'taskCount', type: 'uint32', desc: '任务数量' },
      {
        name: 'tasks',
        type: 'array',
        arrayCountField: 'taskCount',
        arrayFields: [
          { name: 'taskId', type: 'uint32', desc: '任务ID' },
          { name: 'status', type: 'uint32', desc: '状态 (0=未开始, 1=进行中, 2=已完成)' },
          { name: 'endTime', type: 'uint32', desc: '结束时间 (Unix时间戳)' }
        ],
        desc: '任务列表'
      }
    ]
  }
];
