import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetReleaseRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetReleaseRspProto';
import { PetInfoProto } from '../../../../../shared/proto/common/PetInfoProto';

/**
 * 释放精灵响应包
 * CMD 2304
 */
export class PacketPetRelease extends BaseProto {
  private _data: Buffer;

  constructor(homeEnergy: number, firstPetTime: number, flag: number, petInfo?: PetInfoProto) {
    super(CommandID.PET_RELEASE);
    const proto = new PetReleaseRspProto();
    proto.homeEnergy = homeEnergy;
    proto.firstPetTime = firstPetTime;
    proto.flag = flag;
    if (petInfo) {
      proto.petInfo = petInfo;
    }
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
