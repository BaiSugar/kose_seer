import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * 聊天相关命令元数据
 */
export const ChatMetadata: ICommandMeta[] = [
  /**
   * [CMD: CHAT (2102)] 聊天
   * 请求: channel(1) + message(变长)
   * 响应: senderID(4) + senderNick(16) + toID(4) + msgLen(4) + msg(msgLen)
   */
  {
    cmdID: CommandID.CHAT,
    name: 'CHAT',
    desc: '聊天',
    request: [
      { name: 'channel', type: 'uint8', desc: '频道' },
      { name: 'message', type: 'varstring', desc: '消息内容' }
    ],
    response: [
      { name: 'senderID', type: 'uint32', desc: '发送者ID' },
      { name: 'senderNick', type: 'string', length: 16, desc: '发送者昵称' },
      { name: 'toID', type: 'uint32', desc: '接收者ID (0=公共聊天)' },
      { name: 'msgLen', type: 'uint32', desc: '消息长度' },
      { name: 'msg', type: 'varstring', desc: '聊天内容' }
    ]
  }
];
