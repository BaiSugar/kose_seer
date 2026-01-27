import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { NoNoIsInfoRspProto } from '../../../../../shared/proto/packets/rsp/nono/NoNoIsInfoRspProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * NoNo是否有信息响应包
 */
export class PacketNoNoIsInfo extends BaseProto {
  private _data: Buffer;

  constructor(hasNono: number) {
    super(CommandID.NONO_IS_INFO);
    const proto = new NoNoIsInfoRspProto().setHasNono(hasNono);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
