import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2312] 精灵技能切换请求
 */
export class PetSkillSwitchReqProto extends BaseProto {
  petId: number = 0;       // 精灵ID
  slot1: number = 0;       // 技能槽1
  slot2: number = 0;       // 技能槽2

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetSkillSwitchReqProto {
    const proto = new PetSkillSwitchReqProto();
    if (buffer.length >= 12) {
      proto.petId = buffer.readUInt32BE(0);
      proto.slot1 = buffer.readUInt32BE(4);
      proto.slot2 = buffer.readUInt32BE(8);
    }
    return proto;
  }
}
