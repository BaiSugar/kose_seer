import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 玩家变身请求
 * CMD: 2111 PEOPLE_TRANSFROM
 */
export class PeopleTransformReqProto extends BaseProto {
  public transId: number = 0;

  constructor() {
    super(CommandID.PEOPLE_TRANSFROM);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.transId = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.transId, 0);
    return buffer;
  }
}
