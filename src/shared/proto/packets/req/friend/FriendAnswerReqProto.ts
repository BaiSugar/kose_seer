import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 好友请求回复
 * CMD 2152
 * 
 * 请求格式: targetId(4) + accept(4)
 */
export class FriendAnswerReqProto extends BaseProto {
  public targetId: number = 0;
  public accept: number = 0;

  constructor() {
    super(CommandID.FRIEND_ANSWER);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    if (buffer.length >= 4) {
      this.targetId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    
    if (buffer.length >= 8) {
      this.accept = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
