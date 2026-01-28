import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 添加好友请求
 * CMD 2151
 * 
 * 请求格式: targetId(4)
 */
export class FriendAddReqProto extends BaseProto {
  public targetId: number = 0;

  constructor() {
    super(CommandID.FRIEND_ADD);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.targetId = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
