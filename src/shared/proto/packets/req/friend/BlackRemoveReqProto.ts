import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 移除黑名单请求
 * CMD 2155
 * 
 * 请求格式: targetId(4)
 */
export class BlackRemoveReqProto extends BaseProto {
  public targetId: number = 0;

  constructor() {
    super(CommandID.BLACK_REMOVE);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.targetId = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
