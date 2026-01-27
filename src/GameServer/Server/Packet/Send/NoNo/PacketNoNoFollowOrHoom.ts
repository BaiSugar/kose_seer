import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoFollowOrHoomRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoFollowOrHoomRspProto';

/**
 * NoNo 跟随或回家响应包
 * CMD 9019
 */
export class PacketNoNoFollowOrHoom extends BaseProto {
  private _data: Buffer;

  constructor(
    userId: number,
    flag: number,
    state: number,
    isFollow: boolean,
    nick?: string,
    color?: number,
    chargeTime?: number
  ) {
    super(CommandID.NONO_FOLLOW_OR_HOOM);
    const proto = new NoNoFollowOrHoomRspProto();
    proto.userId = userId;
    proto.flag = flag;
    proto.state = state;
    proto.isFollow = isFollow;
    
    if (isFollow && nick !== undefined && color !== undefined && chargeTime !== undefined) {
      proto.nick = nick;
      proto.color = color;
      proto.chargeTime = chargeTime;
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
