import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetPetInfoRspProto } from '../../../../../shared/proto/packets/rsp/pet/GetPetInfoRspProto';
import { PetInfoProto } from '../../../../../shared/proto/common/PetInfoProto';

/**
 * 获取精灵信息响应包
 * CMD 2301
 */
export class PacketGetPetInfo extends BaseProto {
  private _data: Buffer;

  constructor(petInfo?: PetInfoProto, result: number = 0) {
    super(CommandID.GET_PET_INFO);
    const proto = new GetPetInfoRspProto();
    if (petInfo) {
      proto.petInfo = petInfo;
    }
    if (result !== 0) {
      proto.setResult(result);
    }
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
