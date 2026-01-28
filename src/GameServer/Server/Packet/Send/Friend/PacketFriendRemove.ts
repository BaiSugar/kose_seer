import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendRemoveRspProto } from '../../../../../shared/proto/packets/rsp/friend/FriendRemoveRspProto';

/**
 * 删除好友响应包
 * CMD 2153
 */
export class PacketFriendRemove extends BaseProto {
  private _data: Buffer;

  constructor(result: number = 0) {
    super(CommandID.FRIEND_REMOVE);
    
    const proto = new FriendRemoveRspProto();
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
