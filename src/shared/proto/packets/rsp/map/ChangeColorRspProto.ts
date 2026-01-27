import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 修改颜色响应
 * CMD: 2063 CHANGE_COLOR
 */
export class ChangeColorRspProto extends BaseProto {
  public userId: number = 0;
  public newColor: number = 0;
  public cost: number = 0;
  public remain: number = 0;

  constructor(userId: number = 0, newColor: number = 0, cost: number = 0, remain: number = 0) {
    super(CommandID.CHANGE_COLOR);
    this.userId = userId;
    this.newColor = newColor;
    this.cost = cost;
    this.remain = remain;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.newColor = buffer.readUInt32BE(offset); offset += 4;
    this.cost = buffer.readUInt32BE(offset); offset += 4;
    this.remain = buffer.readUInt32BE(offset); offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(16);
    let offset = 0;
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    buffer.writeUInt32BE(this.newColor, offset); offset += 4;
    buffer.writeUInt32BE(this.cost, offset); offset += 4;
    buffer.writeUInt32BE(this.remain, offset); offset += 4;
    return buffer;
  }
}
