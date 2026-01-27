import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 离开地图响应
 * CMD: 2002 LEAVE_MAP
 */
export class LeaveMapRspProto extends BaseProto {
  public userId: number = 0;

  constructor(userId: number = 0) {
    super(CommandID.LEAVE_MAP);
    this.userId = userId;
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.userId = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.userId, 0);
    return buffer;
  }
}
