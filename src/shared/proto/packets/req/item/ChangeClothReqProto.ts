import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 更换服装请求
 * CMD 2604
 */
export class ChangeClothReqProto extends BaseProto {
  public clothIds: number[] = [];

  constructor() {
    super(CommandID.CHANGE_CLOTH);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;

    if (buffer.length >= 4) {
      const clothCount = buffer.readUInt32BE(offset);
      offset += 4;

      for (let i = 0; i < clothCount; i++) {
        if (buffer.length >= offset + 4) {
          const clothId = buffer.readUInt32BE(offset);
          this.clothIds.push(clothId);
          offset += 4;
        }
      }
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
