import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';
import { PetInfoProto } from '../../../common/PetInfoProto';

/**
 * [CMD: 2303 GET_PET_LIST] 获取精灵列表响应
 */
export class GetPetListRspProto extends BaseProto {
  pets: PetInfoProto[] = [];  // 精灵列表

  constructor() {
    super(CommandID.GET_PET_LIST);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1024);
    
    // 写入精灵数量
    writer.WriteUInt32(this.pets.length);
    
    // 写入每个精灵的信息
    for (const pet of this.pets) {
      const petData = pet.serialize();
      writer.WriteBytes(petData);
    }
    
    return writer.ToBuffer();
  }

  setPets(pets: PetInfoProto[]): this {
    this.pets = pets;
    return this;
  }
}
