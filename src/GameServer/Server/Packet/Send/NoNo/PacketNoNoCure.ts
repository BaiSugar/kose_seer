import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoNoCureRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoCureRspProto';

/**
 * NoNo 治疗响应包
 * CMD 9007
 * 
 * 空响应包
 */
export class PacketNoNoCure extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.NONO_CURE);
    const proto = new NoNoCureRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
