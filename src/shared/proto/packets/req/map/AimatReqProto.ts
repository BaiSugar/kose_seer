import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 瞄准/交互请求
 * CMD: 2104 AIMAT
 */
export class AimatReqProto extends BaseProto {
  public targetType: number = 0;
  public targetId: number = 0;
  public x: number = 0;
  public y: number = 0;

  constructor() {
    super(CommandID.AIMAT);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 16) {
      this.targetType = buffer.readUInt32BE(offset); offset += 4;
      this.targetId = buffer.readUInt32BE(offset); offset += 4;
      this.x = buffer.readUInt32BE(offset); offset += 4;
      this.y = buffer.readUInt32BE(offset); offset += 4;
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(16);
    let offset = 0;
    buffer.writeUInt32BE(this.targetType, offset); offset += 4;
    buffer.writeUInt32BE(this.targetId, offset); offset += 4;
    buffer.writeUInt32BE(this.x, offset); offset += 4;
    buffer.writeUInt32BE(this.y, offset); offset += 4;
    return buffer;
  }
}
