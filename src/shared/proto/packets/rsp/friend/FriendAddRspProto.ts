import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 添加好友响应
 * CMD 2151
 * 
 * 响应格式: targetId(4)
 */
export class FriendAddRspProto extends BaseProto {
  public targetId: number = 0;

  constructor() {
    super(CommandID.FRIEND_ADD);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.targetId, 0);
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.targetId = buffer.readUInt32BE(0);
    }
  }

  // 链式调用辅助方法
  public setTargetId(targetId: number): this {
    this.targetId = targetId;
    return this;
  }
}
