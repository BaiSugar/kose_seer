import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 开关飞行模式响应
 * CMD: 2112 ON_OR_OFF_FLYING
 */
export class OnOrOffFlyingRspProto extends BaseProto {
  public userId: number = 0;
  public flyMode: number = 0;

  constructor(userId: number = 0, flyMode: number = 0) {
    super(CommandID.ON_OR_OFF_FLYING);
    this.userId = userId;
    this.flyMode = flyMode;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.flyMode = buffer.readUInt32BE(offset); offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    let offset = 0;
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    buffer.writeUInt32BE(this.flyMode, offset); offset += 4;
    return buffer;
  }
}
