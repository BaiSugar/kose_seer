import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2306 PET_CURE] 治疗精灵请求
 */
export class PetCureReqProto extends BaseProto {
  cureType: number = 0;   // 治疗类型 (0=全部, 1=单个)
  catchTime: number = 0;  // 捕获时间（单个治疗时）

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetCureReqProto {
    const proto = new PetCureReqProto();
    if (buffer.length >= 8) {
      proto.cureType = buffer.readUInt32BE(0);
      proto.catchTime = buffer.readUInt32BE(4);
    }
    return proto;
  }
}
