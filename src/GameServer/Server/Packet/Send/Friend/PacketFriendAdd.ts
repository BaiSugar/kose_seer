import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendAddRspProto } from '../../../../../shared/proto/packets/rsp/friend/FriendAddRspProto';

/**
 * 添加好友响应包
 * CMD 2151
 */
export class PacketFriendAdd extends BaseProto {
  private _data: Buffer;

  constructor(targetId: number, result: number = 0) {
    super(CommandID.FRIEND_ADD);
    
    const proto = new FriendAddRspProto();
    proto.targetId = targetId;
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
