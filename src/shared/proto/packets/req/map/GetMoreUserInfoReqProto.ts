import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取详细用户信息请求
 * CMD: 2052 GET_MORE_USERINFO
 */
export class GetMoreUserInfoReqProto extends BaseProto {
  public targetId: number = 0;

  constructor() {
    super(CommandID.GET_MORE_USERINFO);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.targetId = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.targetId, 0);
    return buffer;
  }
}
