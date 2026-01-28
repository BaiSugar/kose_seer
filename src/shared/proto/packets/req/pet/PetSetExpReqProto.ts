import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配请求
 * 精灵分配仪功能 - 将经验分配给指定精灵
 */
export class PetSetExpReqProto extends BaseProto {
  catchTime: number = 0;  // 精灵捕获时间（唯一标识）
  expAmount: number = 0;  // 要分配的经验值

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): PetSetExpReqProto {
    const proto = new PetSetExpReqProto();
    if (buffer.length >= 8) {
      proto.catchTime = buffer.readUInt32BE(0);
      proto.expAmount = buffer.readUInt32BE(4);
    }
    return proto;
  }
}
