import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 开关飞行模式请求
 * CMD: 2112 ON_OR_OFF_FLYING
 */
export class OnOrOffFlyingReqProto extends BaseProto {
  public flyMode: number = 0;

  constructor() {
    super(CommandID.ON_OR_OFF_FLYING);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.flyMode = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.flyMode, 0);
    return buffer;
  }
}
