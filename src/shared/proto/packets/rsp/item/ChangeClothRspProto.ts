import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 更换服装响应
 * CMD 2604
 */
export class ChangeClothRspProto extends BaseProto {
  private userId: number;
  private clothIds: number[];

  constructor(userId: number, clothIds: number[]) {
    super(CommandID.CHANGE_CLOTH);
    this.userId = userId;
    this.clothIds = clothIds;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(8 + this.clothIds.length * 8);
    let offset = 0;

    buffer.writeUInt32BE(this.userId, offset);
    offset += 4;
    buffer.writeUInt32BE(this.clothIds.length, offset);
    offset += 4;

    for (const clothId of this.clothIds) {
      buffer.writeUInt32BE(clothId, offset);
      offset += 4;
      buffer.writeUInt32BE(0, offset);  // clothType (从XML获取，简化为0)
      offset += 4;
    }

    return buffer;
  }
}
