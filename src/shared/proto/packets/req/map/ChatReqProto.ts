import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2102 CHAT] 聊天请求
 */
export class ChatReqProto extends BaseProto {
  chatType: number = 0;  // 聊天类型
  msg: string = '';      // 消息内容

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): ChatReqProto {
    const proto = new ChatReqProto();
    if (buffer.length >= 8) {
      proto.chatType = buffer.readUInt32BE(0);
      const msgLen = buffer.readUInt32BE(4);
      if (buffer.length >= 8 + msgLen) {
        proto.msg = buffer.toString('utf8', 8, 8 + msgLen);
      }
    }
    return proto;
  }
}
