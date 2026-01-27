import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: 9002 NONO_CHANGE_NAME] 修改NoNo昵称
 * 请求: newName(16 bytes)
 */
export class NoNoChangeNameReqProto extends BaseProto {
  newName: string = '';

  constructor() {
    super(0);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): NoNoChangeNameReqProto {
    const proto = new NoNoChangeNameReqProto();
    if (buffer.length >= 16) {
      proto.newName = buffer.toString('utf8', 0, 16).replace(/\0/g, '').trim();
    }
    return proto;
  }
}
