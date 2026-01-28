import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FriendAnswerRspProto } from '../../../../../shared/proto/packets/rsp/friend/FriendAnswerRspProto';

/**
 * 好友请求回复响应包
 * CMD 2152
 */
export class PacketFriendAnswer extends BaseProto {
  private _data: Buffer;

  constructor(accept: number, result: number = 0) {
    super(CommandID.FRIEND_ANSWER);
    
    const proto = new FriendAnswerRspProto();
    proto.accept = accept;
    
    if (result !== 0) {
      proto.setResult(result);
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
