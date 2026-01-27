import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoInfoRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoInfoRspProto';

/**
 * NoNo 信息响应包
 * CMD 9003
 * 
 */
export class PacketNoNoInfo extends BaseProto {
  private _data: Buffer;

  constructor(
    userId: number,
    flag: number,
    state: number,
    nick: string,
    color: number,
    power: number,
    mate: number,
    iq: number,
    ai: number,
    superLevel: number,
    bio: number,
    birth: number,
    chargeTime: number,
    expire: number,
    chip: number,
    grow: number
  ) {
    super(CommandID.NONO_INFO);
    
    const proto = new NoNoInfoRspProto();
    proto.userId = userId;
    proto.flag = flag;
    proto.state = state;
    proto.nick = nick;
    proto.color = color;
    proto.power = power;
    proto.mate = mate;
    proto.iq = iq;
    proto.ai = ai;
    proto.superLevel = superLevel;
    proto.bio = bio;
    proto.birth = birth;
    proto.chargeTime = chargeTime;
    proto.expire = expire;
    proto.chip = chip;
    proto.grow = grow;
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
