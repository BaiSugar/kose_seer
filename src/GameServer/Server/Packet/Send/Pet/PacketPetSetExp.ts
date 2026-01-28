import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetSetExpRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetSetExpRspProto';

/**
 * 设置精灵经验分配响应包
 * CMD 2318
 */
export class PacketPetSetExp extends BaseProto {
  private _data: Buffer;

  constructor(catchTime: number, newLevel: number, newExp: number, remainingAllocExp: number) {
    super(CommandID.PET_SET_EXP);
    const proto = new PetSetExpRspProto(catchTime, newLevel, newExp, remainingAllocExp);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
