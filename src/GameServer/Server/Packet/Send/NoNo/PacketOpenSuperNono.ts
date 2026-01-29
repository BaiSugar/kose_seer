import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { OpenSuperNonoRspProto } from '../../../../../shared/proto/packets/rsp/nono/OpenSuperNonoRspProto';

/**
 * 开启超级NoNo响应包
 */
export class PacketOpenSuperNono extends BaseProto {
  private _data: Buffer;

  constructor(success: number = 0) {
    super(CommandID.OPEN_SUPER_NONO);
    const proto = new OpenSuperNonoRspProto(success);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
