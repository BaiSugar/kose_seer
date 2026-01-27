import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';
import { PetInfoProto } from '../../../common/PetInfoProto';

/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息响应
 */
export class GetPetInfoRspProto extends BaseProto {
  petInfo: PetInfoProto | null = null;  // 精灵信息

  constructor() {
    super(CommandID.GET_PET_INFO);
  }

  serialize(): Buffer {
    if (!this.petInfo) {
      return Buffer.alloc(0);
    }
    
    return this.petInfo.serialize();
  }

  setPetInfo(petInfo: PetInfoProto): this {
    this.petInfo = petInfo;
    return this;
  }
}
