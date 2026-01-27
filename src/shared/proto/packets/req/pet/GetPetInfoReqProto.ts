import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息请求
 */
export class GetPetInfoReqProto extends BaseProto {
  catchTime: number = 0;  // 捕获时间（精灵唯一标识）

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): GetPetInfoReqProto {
    const proto = new GetPetInfoReqProto();
    if (buffer.length >= 4) {
      proto.catchTime = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
