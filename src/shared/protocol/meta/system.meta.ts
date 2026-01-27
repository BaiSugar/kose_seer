/**
 * 系统模块元数据
 * 包含系统相关的所有命令元数据定义
 */
import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

export const SystemModuleMetadata: ICommandMeta[] = [
  {
    cmdID: CommandID.SYSTEM_TIME,
    name: 'SYSTEM_TIME',
    desc: '获取系统时间',
    request: [],
    response: [
      { name: 'timestamp', type: 'uint32', desc: '时间戳(秒)' }
    ]
  },
  {
    cmdID: CommandID.SYSTEM_MESSAGE,
    name: 'SYSTEM_MESSAGE',
    desc: '系统通知消息',
    request: [],
    response: [
      { name: 'type', type: 'uint16', desc: '消息类型' },
      { name: 'npc', type: 'uint16', desc: 'NPC ID' },
      { name: 'msgTime', type: 'uint32', desc: '消息时间戳' },
      { name: 'msgLength', type: 'uint32', desc: '消息长度' },
      { name: 'message', type: 'string', lengthField: 'msgLength', desc: '消息内容(HTML格式)' }
    ]
  },
  {
    cmdID: CommandID.MAP_HOT,
    name: 'MAP_HOT',
    desc: '获取地图热度',
    request: [],
    response: [
      { name: 'mapCount', type: 'uint32', desc: '地图数量' },
      { name: 'mapList', type: 'bytes', desc: '地图列表 [mapId(4) + onlineCount(4)]...' }
    ]
  },
  {
    cmdID: CommandID.GET_IMAGE_ADDRESS,
    name: 'GET_IMAGE_ADDRESS',
    desc: '获取图片服务器地址',
    request: [],
    response: [
      { name: 'ip', type: 'string', length: 16, desc: 'IP地址' },
      { name: 'port', type: 'uint16', desc: '端口' },
      { name: 'session', type: 'string', length: 16, desc: '会话' }
    ]
  }
];
