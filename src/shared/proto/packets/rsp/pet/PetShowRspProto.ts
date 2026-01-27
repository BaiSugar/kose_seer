import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2305 PET_SHOW] 展示精灵响应
 * PetShowInfo: userID(4) + catchTime(4) + petID(4) + flag(4) + dv(4) + skinID(4)
 */
export class PetShowRspProto extends BaseProto {
  userId: number = 0;      // 用户ID
  catchTime: number = 0;   // 捕获时间
  petId: number = 0;       // 精灵ID
  flag: number = 0;        // 标志
  dv: number = 31;         // 个体值
  skinId: number = 0;      // 皮肤ID

  constructor() {
    super(CommandID.PET_SHOW);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(24);
    writer.WriteUInt32(this.userId);
    writer.WriteUInt32(this.catchTime);
    writer.WriteUInt32(this.petId);
    writer.WriteUInt32(this.flag);
    writer.WriteUInt32(this.dv);
    writer.WriteUInt32(this.skinId);
    return writer.ToBuffer();
  }

  setUserId(userId: number): this {
    this.userId = userId;
    return this;
  }

  setCatchTime(catchTime: number): this {
    this.catchTime = catchTime;
    return this;
  }

  setPetId(petId: number): this {
    this.petId = petId;
    return this;
  }

  setFlag(flag: number): this {
    this.flag = flag;
    return this;
  }

  setDv(dv: number): this {
    this.dv = dv;
    return this;
  }

  setSkinId(skinId: number): this {
    this.skinId = skinId;
    return this;
  }
}
