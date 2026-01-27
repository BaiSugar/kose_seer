import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2102 CHAT] 聊天响应
 */
export class ChatRspProto extends BaseProto {
  senderId: number = 0;      // 发送者ID
  senderNick: string = '';   // 发送者昵称 (16字节)
  toId: number = 0;          // 接收者ID (0=公共聊天)
  msg: string = '';          // 消息内容

  constructor() {
    super(CommandID.CHAT);
  }

  serialize(): Buffer {
    const msgBuffer = Buffer.from(this.msg, 'utf8');
    const writer = new BufferWriter(256);
    
    writer.WriteUInt32(this.senderId);
    writer.WriteBytes(this.buildString(this.senderNick, 16));
    writer.WriteUInt32(this.toId);
    writer.WriteUInt32(msgBuffer.length);
    writer.WriteBytes(msgBuffer);
    
    return writer.ToBuffer();
  }

  // 链式调用辅助方法
  setSenderId(value: number): this {
    this.senderId = value;
    return this;
  }

  setSenderNick(value: string): this {
    this.senderNick = value;
    return this;
  }

  setToId(value: number): this {
    this.toId = value;
    return this;
  }

  setMsg(value: string): this {
    this.msg = value;
    return this;
  }
}
