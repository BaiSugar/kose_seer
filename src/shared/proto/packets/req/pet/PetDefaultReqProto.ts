import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵请求
 */
export class PetDefaultReqProto extends BaseProto {
  catchTime: number = 0;  // 捕获时间

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetDefaultReqProto {
    const proto = new PetDefaultReqProto();
    if (buffer.length >= 4) {
      proto.catchTime = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
