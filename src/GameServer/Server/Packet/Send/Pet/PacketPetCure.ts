import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetCureRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetCureRspProto';

/**
 * 治疗精灵响应包
 * CMD 2306
 */
export class PacketPetCure extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.PET_CURE);
    const proto = new PetCureRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
