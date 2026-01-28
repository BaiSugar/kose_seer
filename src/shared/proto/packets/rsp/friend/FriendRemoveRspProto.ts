import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 删除好友响应
 * CMD 2153
 * 
 * 响应格式: 空包
 */
export class FriendRemoveRspProto extends BaseProto {
  constructor() {
    super(CommandID.FRIEND_REMOVE);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }

  public deserialize(buffer: Buffer): void {
    // 空包，无需解析
  }
}
