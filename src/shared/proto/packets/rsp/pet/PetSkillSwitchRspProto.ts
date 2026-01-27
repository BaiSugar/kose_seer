import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2312] 精灵技能切换响应
 */
export class PetSkillSwitchRspProto extends BaseProto {
  petId: number = 0;       // 精灵ID

  constructor() {
    super(CommandID.PET_SKILL_SWICTH);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(8);
    writer.WriteUInt32(this.result);
    writer.WriteUInt32(this.petId);
    return writer.ToBuffer();
  }

  setPetId(value: number): this {
    this.petId = value;
    return this;
  }
}
