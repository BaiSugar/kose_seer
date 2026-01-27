import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';
import { PetInfoProto } from '../../../common/PetInfoProto';

/**
 * [CMD: 2304 PET_RELEASE] 释放精灵响应
 * Response: homeEnergy(4) + firstPetTime(4) + flag(4) + [PetInfo]
 */
export class PetReleaseRspProto extends BaseProto {
  homeEnergy: number = 0;           // 家园能量
  firstPetTime: number = 0;         // 首个精灵时间
  flag: number = 0;                 // 标志 (1=包含精灵信息)
  petInfo: PetInfoProto | null = null;  // 精灵信息（flag=1时）

  constructor() {
    super(CommandID.PET_RELEASE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1024);
    
    writer.WriteUInt32(this.homeEnergy);
    writer.WriteUInt32(this.firstPetTime);
    writer.WriteUInt32(this.flag);
    
    // 如果flag != 0，写入精灵信息
    if (this.flag !== 0 && this.petInfo) {
      const petData = this.petInfo.serialize();
      writer.WriteBytes(petData);
    }
    
    return writer.ToBuffer();
  }

  setHomeEnergy(homeEnergy: number): this {
    this.homeEnergy = homeEnergy;
    return this;
  }

  setFirstPetTime(firstPetTime: number): this {
    this.firstPetTime = firstPetTime;
    return this;
  }

  setFlag(flag: number): this {
    this.flag = flag;
    return this;
  }

  setPetInfo(petInfo: PetInfoProto): this {
    this.petInfo = petInfo;
    return this;
  }
}
