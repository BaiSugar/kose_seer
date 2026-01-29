import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetSetExpRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetSetExpRspProto';

/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配响应包
 * 
 * 根据 Lua 端实现，只返回经验池剩余经验（4字节）
 */
export class PacketPetSetExp extends BaseProto {
  private _data: Buffer;

  constructor(remainingAllocExp: number) {
    super(CommandID.PET_SET_EXP);
    const proto = new PetSetExpRspProto(remainingAllocExp);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
