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
    superStage: number,
    state: number,
    isFollow: boolean,
    nick?: string,
    color?: number,
    power?: number
  ) {
    super(CommandID.NONO_FOLLOW_OR_HOOM);
    const proto = new NoNoFollowOrHoomRspProto();
    proto.userId = userId;
    proto.superStage = superStage;
    proto.state = state;
    proto.isFollow = isFollow;
    
    if (isFollow && nick !== undefined && color !== undefined && power !== undefined) {
      proto.nick = nick;
      proto.color = color;
      proto.power = power;
    }
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
