import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2307] 精灵学习技能响应
 */
export class PetStudySkillRspProto extends BaseProto {
  petId: number = 0;       // 精灵ID
  skillId: number = 0;     // 技能ID
  slotIndex: number = 0;   // 技能槽位置

  constructor() {
    super(CommandID.PET_STUDY_SKILL);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(16);
    writer.WriteUInt32(this.result);
    writer.WriteUInt32(this.petId);
    writer.WriteUInt32(this.skillId);
    writer.WriteUInt32(this.slotIndex);
    return writer.ToBuffer();
  }

  setPetId(value: number): this {
    this.petId = value;
    return this;
  }

  setSkillId(value: number): this {
    this.skillId = value;
    return this;
  }

  setSlotIndex(value: number): this {
    this.slotIndex = value;
    return this;
  }
}
