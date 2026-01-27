import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2304 PET_RELEASE] 释放精灵请求
 * Request: catchId(4) + flag(4)
 */
export class PetReleaseReqProto extends BaseProto {
  catchId: number = 0;  // 捕获ID
  flag: number = 0;     // 标志

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetReleaseReqProto {
    const proto = new PetReleaseReqProto();
    if (buffer.length >= 8) {
      proto.catchId = buffer.readUInt32BE(0);
      proto.flag = buffer.readUInt32BE(4);
    }
    return proto;
  }
}
