import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetGetExpRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetGetExpRspProto';

/**
 * 获取精灵经验分配信息响应包
 * CMD 2319
 */
export class PacketPetGetExp extends BaseProto {
  private _data: Buffer;

  constructor(allocatableExp: number) {
    super(CommandID.PET_GET_EXP);
    const proto = new PetGetExpRspProto(allocatableExp);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
