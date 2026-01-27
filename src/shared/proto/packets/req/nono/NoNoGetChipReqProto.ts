import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片
 * 请求: chipType(4)
 */
export class NoNoGetChipReqProto extends BaseProto {
  chipType: number = 0;

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): NoNoGetChipReqProto {
    const proto = new NoNoGetChipReqProto();
    if (buffer.length >= 4) {
      proto.chipType = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
