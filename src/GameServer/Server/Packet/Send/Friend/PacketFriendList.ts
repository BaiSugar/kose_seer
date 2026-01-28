import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendListRspProto, IFriendInfo } from '../../../../../shared/proto/packets/rsp/friend/FriendListRspProto';

/**
 * 好友列表响应包
 * CMD 2158
 */
export class PacketFriendList extends BaseProto {
  private _data: Buffer;

  constructor(friendList: IFriendInfo[], result: number = 0) {
    super(CommandID.FRIEND_LIST);
    
    const proto = new FriendListRspProto();
    proto.friendList = friendList;
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
