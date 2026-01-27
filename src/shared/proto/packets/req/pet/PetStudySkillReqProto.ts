import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2307] 精灵学习技能请求
 */
export class PetStudySkillReqProto extends BaseProto {
  petId: number = 0;       // 精灵ID
  skillId: number = 0;     // 技能ID
  slotIndex: number = 0;   // 技能槽位置 (0-3)

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetStudySkillReqProto {
    const proto = new PetStudySkillReqProto();
    if (buffer.length >= 12) {
      proto.petId = buffer.readUInt32BE(0);
      proto.skillId = buffer.readUInt32BE(4);
      proto.slotIndex = buffer.readUInt32BE(8);
    }
    return proto;
  }
}
