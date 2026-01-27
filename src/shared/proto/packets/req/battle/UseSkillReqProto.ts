import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2405 USE_SKILL] 使用技能请求
 */
export class UseSkillReqProto extends BaseProto {
  skillId: number = 0;  // 技能ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): UseSkillReqProto {
    const proto = new UseSkillReqProto();
    if (buffer.length >= 4) {
      proto.skillId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
