import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetDefaultRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetDefaultRspProto';

/**
 * 设置默认精灵响应包
 * CMD 2308
 */
export class PacketPetDefault extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.PET_DEFAULT);
    const proto = new PetDefaultRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
