import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo
 * 请求: 无参数
 */
export class NoNoOpenReqProto extends BaseProto {
  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): NoNoOpenReqProto {
    return new NoNoOpenReqProto();
  }
}
