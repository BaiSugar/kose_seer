import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2336] 获取精灵技能请求
 */
export class GetPetSkillReqProto extends BaseProto {
  petId: number = 0;       // 精灵ID

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): GetPetSkillReqProto {
    const proto = new GetPetSkillReqProto();
    if (buffer.length >= 4) {
      proto.petId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
