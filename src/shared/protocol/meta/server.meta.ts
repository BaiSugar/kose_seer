import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * 服务器相关命令元数据
 */
export const ServerMetadata: ICommandMeta[] = [
  /**
   * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表
   * 请求: (空)
   * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers[onlineCnt]...
   */
  {
    cmdID: CommandID.COMMEND_ONLINE,
    name: 'COMMEND_ONLINE',
    desc: '推荐服务器列表',
    request: [],
    response: [
      { name: 'maxOnlineID', type: 'uint32', desc: '最大服务器ID' },
      { name: 'isVIP', type: 'uint32', desc: '是否VIP' },
      { name: 'onlineCnt', type: 'uint32', desc: '服务器数量' },
      {
        name: 'server',
        type: 'array',
        arrayCountField: 'onlineCnt',
        arrayFields: [
          { name: 'onlineID', type: 'uint32', desc: '服务器ID' },
          { name: 'userCnt', type: 'uint32', desc: '在线人数' },
          { name: 'ip', type: 'string', length: 16, desc: '服务器IP' },
          { name: 'port', type: 'uint16', desc: '端口' },
          { name: 'friends', type: 'uint32', desc: '好友数' }
        ],
        desc: '服务器列表'
      }
    ]
  },

  /**
   * [CMD: RANGE_ONLINE (106)] 范围服务器查询
   * 请求: (空)
   * 响应: onlineCnt(4) + servers[onlineCnt]...
   */
  {
    cmdID: CommandID.RANGE_ONLINE,
    name: 'RANGE_ONLINE',
    desc: '范围服务器查询',
    request: [],
    response: [
      { name: 'onlineCnt', type: 'uint32', desc: '服务器数量' },
      {
        name: 'server',
        type: 'array',
        arrayCountField: 'onlineCnt',
        arrayFields: [
          { name: 'onlineID', type: 'uint32', desc: '服务器ID' },
          { name: 'userCnt', type: 'uint32', desc: '在线人数' },
          { name: 'ip', type: 'string', length: 16, desc: '服务器IP' },
          { name: 'port', type: 'uint16', desc: '端口' },
          { name: 'friends', type: 'uint32', desc: '好友数' }
        ],
        desc: '服务器列表'
      }
    ]
  }
];
