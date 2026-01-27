import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 修改颜色请求
 * CMD: 2063 CHANGE_COLOR
 */
export class ChangeColorReqProto extends BaseProto {
  public newColor: number = 0;

  constructor() {
    super(CommandID.CHANGE_COLOR);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.newColor = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.newColor, 0);
    return buffer;
  }
}
