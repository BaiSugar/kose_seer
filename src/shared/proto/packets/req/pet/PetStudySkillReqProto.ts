import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2307] 精灵学习技能请求
 * 
 * 请求格式：
 * - catchTime: uint32 (精灵捕获时间)
 * - flag1: uint32 (未知标志，通常为1)
 * - flag2: uint32 (未知标志，通常为1)
 * - dropSkillId: uint32 (要替换掉的技能ID)
 * - studySkillId: uint32 (要学习的新技能ID)
 */
export class PetStudySkillReqProto extends BaseProto {
  catchTime: number = 0;      // 精灵捕获时间
  flag1: number = 0;          // 未知标志
  flag2: number = 0;          // 未知标志
  dropSkillId: number = 0;    // 要替换掉的技能ID
  studySkillId: number = 0;   // 要学习的新技能ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetStudySkillReqProto {
    const proto = new PetStudySkillReqProto();
    if (buffer.length >= 20) {
      proto.catchTime = buffer.readUInt32BE(0);
      proto.flag1 = buffer.readUInt32BE(4);
      proto.flag2 = buffer.readUInt32BE(8);
      proto.dropSkillId = buffer.readUInt32BE(12);
      proto.studySkillId = buffer.readUInt32BE(16);
    }
    return proto;
  }
}
