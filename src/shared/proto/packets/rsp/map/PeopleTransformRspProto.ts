import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 玩家变身响应
 * CMD: 2111 PEOPLE_TRANSFROM
 */
export class PeopleTransformRspProto extends BaseProto {
  public userId: number = 0;
  public transId: number = 0;

  constructor(userId: number = 0, transId: number = 0) {
    super(CommandID.PEOPLE_TRANSFROM);
    this.userId = userId;
    this.transId = transId;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    this.userId = buffer.readUInt32BE(offset); offset += 4;
    this.transId = buffer.readUInt32BE(offset); offset += 4;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8);
    let offset = 0;
    buffer.writeUInt32BE(this.userId, offset); offset += 4;
    buffer.writeUInt32BE(this.transId, offset); offset += 4;
    return buffer;
  }
}
