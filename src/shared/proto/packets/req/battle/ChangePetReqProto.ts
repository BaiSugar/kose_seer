import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2407 CHANGE_PET] 更换精灵请求
 */
export class ChangePetReqProto extends BaseProto {
  catchTime: number = 0;  // 精灵捕获时间

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): ChangePetReqProto {
    const proto = new ChangePetReqProto();
    if (buffer.length >= 4) {
      proto.catchTime = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
