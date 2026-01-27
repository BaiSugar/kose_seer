import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2305 PET_SHOW] 展示精灵请求
 * Request: catchTime(4) + flag(4)
 */
export class PetShowReqProto extends BaseProto {
  catchTime: number = 0;  // 捕获时间
  flag: number = 0;       // 标志

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetShowReqProto {
    const proto = new PetShowReqProto();
    if (buffer.length >= 8) {
      proto.catchTime = buffer.readUInt32BE(0);
      proto.flag = buffer.readUInt32BE(4);
    }
    return proto;
  }
}
