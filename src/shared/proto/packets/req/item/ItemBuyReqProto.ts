import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 购买物品请求
 * CMD 2601
 */
export class ItemBuyReqProto extends BaseProto {
  public itemId: number = 0;
  public count: number = 1;

  constructor() {
    super(CommandID.ITEM_BUY);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;

    if (buffer.length >= 4) {
      this.itemId = buffer.readUInt32BE(offset);
      offset += 4;
    }

    if (buffer.length >= 8) {
      this.count = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
