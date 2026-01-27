import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetShowRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetShowRspProto';

/**
 * 展示精灵响应包
 * CMD 2305
 */
export class PacketPetShow extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, catchTime: number, petId: number, flag: number, dv: number, skinId: number) {
    super(CommandID.PET_SHOW);
    const proto = new PetShowRspProto();
    proto.userId = userId;
    proto.catchTime = catchTime;
    proto.petId = petId;
    proto.flag = flag;
    proto.dv = dv;
    proto.skinId = skinId;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
