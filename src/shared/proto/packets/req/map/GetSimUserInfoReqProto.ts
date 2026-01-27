import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 获取简单用户信息请求
 * CMD: 2051 GET_SIM_USERINFO
 */
export class GetSimUserInfoReqProto extends BaseProto {
  public targetId: number = 0;

  constructor() {
    super(CommandID.GET_SIM_USERINFO);
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
