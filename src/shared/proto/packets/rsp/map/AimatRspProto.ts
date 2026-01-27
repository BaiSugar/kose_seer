import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 瞄准/交互响应
 * CMD: 2104 AIMAT
 */
export class AimatRspProto extends BaseProto {
  public userId: number = 0;
  public targetType: number = 0;
  public targetId: number = 0;
  public x: number = 0;
  public y: number = 0;

  constructor(userId: number = 0, targetType: number = 0, targetId: number = 0, x: number = 0, y: number = 0) {
    super(CommandID.AIMAT);
    this.userId = userId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.x = x;
    this.y = y;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.targetType = buffer.readUInt32BE(offset); offset += 4;
    this.targetId = buffer.readUInt32BE(offset); offset += 4;
    this.x = buffer.readUInt32BE(offset); offset += 4;
    this.y = buffer.readUInt32BE(offset); offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(20);
    let offset = 0;
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    buffer.writeUInt32BE(this.targetType, offset); offset += 4;
    buffer.writeUInt32BE(this.targetId, offset); offset += 4;
    buffer.writeUInt32BE(this.x, offset); offset += 4;
    buffer.writeUInt32BE(this.y, offset); offset += 4;
    return buffer;
  }
}
