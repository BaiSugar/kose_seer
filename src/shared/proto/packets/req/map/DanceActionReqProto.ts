import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 舞蹈动作请求
 * CMD: 2103 DANCE_ACTION
 */
export class DanceActionReqProto extends BaseProto {
  public actionId: number = 0;
  public actionType: number = 0;

  constructor() {
    super(CommandID.DANCE_ACTION);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 8) {
      this.actionId = buffer.readUInt32BE(offset); offset += 4;
      this.actionType = buffer.readUInt32BE(offset); offset += 4;
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    let offset = 0;
    buffer.writeUInt32BE(this.actionId, offset); offset += 4;
    buffer.writeUInt32BE(this.actionType, offset); offset += 4;
    return buffer;
  }
}
