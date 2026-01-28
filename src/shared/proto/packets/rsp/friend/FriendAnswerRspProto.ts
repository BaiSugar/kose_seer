import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 好友请求回复响应
 * CMD 2152
 * 
 * 响应格式: accept(4)
 */
export class FriendAnswerRspProto extends BaseProto {
  public accept: number = 0;

  constructor() {
    super(CommandID.FRIEND_ANSWER);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.accept, 0);
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.accept = buffer.readUInt32BE(0);
    }
  }

  // 链式调用辅助方法
  public setAccept(accept: number): this {
    this.accept = accept;
    return this;
  }
}
