import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { EscapeFightRspProto } from '../../../../../shared/proto/packets/rsp/battle/EscapeFightRspProto';

/**
 * 逃跑包
 * CMD 2410
 */
export class PacketEscapeFight extends BaseProto {
  private _data: Buffer;

  constructor(success: number = 1) {
    super(CommandID.ESCAPE_FIGHT);
    
    const proto = new EscapeFightRspProto();
    proto.setSuccess(success);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
