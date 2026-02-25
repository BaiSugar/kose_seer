import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度请求
 */
export class LoadPercentReqProto extends BaseProto {
  percent: number = 0;  // 客户端当前加载进度（0-100）

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): LoadPercentReqProto {
    const proto = new LoadPercentReqProto();
    if (buffer.length >= 4) {
      proto.percent = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
