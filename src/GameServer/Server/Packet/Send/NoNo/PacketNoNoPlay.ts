import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoPlayRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoPlayRspProto';

/**
 * NoNo 玩耍响应包
 * CMD 9013
 */
export class PacketNoNoPlay extends BaseProto {
  private _data: Buffer;

  constructor(power: number, ai: number, mate: number, iq: number) {
    super(CommandID.NONO_PLAY);
    const proto = new NoNoPlayRspProto();
    proto.power = power;
    proto.ai = ai;
    proto.mate = mate;
    proto.iq = iq;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
