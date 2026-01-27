import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetListRspProto } from '../../../../../shared/proto/packets/rsp/pet/GetPetListRspProto';
import { PetInfoProto } from '../../../../../shared/proto/common/PetInfoProto';

/**
 * 获取精灵列表响应包
 * CMD 2303
 */
export class PacketGetPetList extends BaseProto {
  private _data: Buffer;

  constructor(pets: PetInfoProto[]) {
    super(CommandID.GET_PET_LIST);
    const proto = new GetPetListRspProto();
    proto.pets = pets;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
