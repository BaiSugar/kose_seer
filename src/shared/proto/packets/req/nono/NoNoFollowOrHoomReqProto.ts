import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家请求
 */
export class NoNoFollowOrHoomReqProto extends BaseProto {
  action: number = 0;  // 0=回家, 1=跟随

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): NoNoFollowOrHoomReqProto {
    const proto = new NoNoFollowOrHoomReqProto();
    if (buffer.length >= 4) {
      proto.action = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
