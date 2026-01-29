import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoInfoRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoInfoRspProto';

/**
 * NoNo 信息响应包
 * CMD 9003
 * 
 * 基于官方服务器抓包数据
 */
export class PacketNoNoInfo extends BaseProto {
  private _data: Buffer;

  constructor(
    userID: number,
    flag: number,
    state: number,
    nick: string,
    superNono: number,
    color: number,
    power: number,
    mate: number,
    iq: number,
    ai: number,
    birth: number,
    chargeTime: number,
    superEnergy: number,
    superLevel: number,
    superStage: number
  ) {
    super(CommandID.NONO_INFO);
    
    const proto = new NoNoInfoRspProto();
    proto.userID = userID;
    proto.flag = flag;
    proto.state = state;
    proto.nick = nick;
    proto.superNono = superNono;
    proto.color = color;
    proto.power = power;
    proto.mate = mate;
    proto.iq = iq;
    proto.ai = ai;
    proto.birth = birth;
    proto.chargeTime = chargeTime;
    proto.func = new Array(160).fill(true);  // 所有功能默认开启
    proto.superEnergy = superEnergy;
    proto.superLevel = superLevel;
    proto.superStage = superStage;
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}

