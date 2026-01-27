import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 技能信息
 */
export interface ISkillInfo {
  skillId: number;
  pp: number;
  maxPP: number;
}

/**
 * [CMD: 2336] 获取精灵技能响应
 */
export class GetPetSkillRspProto extends BaseProto {
  petId: number = 0;                // 精灵ID
  skills: ISkillInfo[] = [];        // 技能列表

  constructor() {
    super(CommandID.GET_PET_SKILL);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(100);
    writer.WriteUInt32(this.result);
    writer.WriteUInt32(this.petId);
    writer.WriteUInt32(this.skills.length);
    
    for (const skill of this.skills) {
      writer.WriteUInt32(skill.skillId);
      writer.WriteUInt32(skill.pp);
      writer.WriteUInt32(skill.maxPP);
    }
    
    return writer.ToBuffer();
  }

  setPetId(value: number): this {
    this.petId = value;
    return this;
  }

  setSkills(value: ISkillInfo[]): this {
    this.skills = value;
    return this;
  }
}
