import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2312] 精灵技能切换请求
 * 
 * 协议格式：
 * - catchTime (4 bytes) - 精灵捕获时间
 * - slot1 (4 bytes) - 技能槽位1 (0-3)
 * - slot2 (4 bytes) - 技能槽位2 (0-3)
 * - oldSkillId (4 bytes) - 旧技能ID
 * - newSkillId (4 bytes) - 新技能ID
 */
export class PetSkillSwitchReqProto extends BaseProto {
  catchTime: number = 0;
  slot1: number = 0;
  slot2: number = 0;
  oldSkillId: number = 0;
  newSkillId: number = 0;

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetSkillSwitchReqProto {
    const proto = new PetSkillSwitchReqProto();
    if (buffer.length >= 20) {
      proto.catchTime = buffer.readUInt32BE(0);
      proto.slot1 = buffer.readUInt32BE(4);
      proto.slot2 = buffer.readUInt32BE(8);
      proto.oldSkillId = buffer.readUInt32BE(12);
      proto.newSkillId = buffer.readUInt32BE(16);
    }
    return proto;
  }
}
