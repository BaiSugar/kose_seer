import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 舞蹈动作响应
 * CMD: 2103 DANCE_ACTION
 */
export class DanceActionRspProto extends BaseProto {
  public userId: number = 0;
  public actionId: number = 0;
  public actionType: number = 0;

  constructor(userId: number = 0, actionId: number = 0, actionType: number = 0) {
    super(CommandID.DANCE_ACTION);
    this.userId = userId;
    this.actionId = actionId;
    this.actionType = actionType;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.actionId = buffer.readUInt32BE(offset); offset += 4;
    this.actionType = buffer.readUInt32BE(offset); offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(12);
    let offset = 0;
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    buffer.writeUInt32BE(this.actionId, offset); offset += 4;
    buffer.writeUInt32BE(this.actionType, offset); offset += 4;
    return buffer;
  }
}
