import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 物品列表请求
 * CMD 2605
 */
export class ItemListReqProto extends BaseProto {
  public itemType1: number = 0;  // 范围起始
  public itemType2: number = 0;  // 范围结束
  public itemType3: number = 0;  // 单个物品ID

  constructor() {
    super(CommandID.ITEM_LIST);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;

    if (buffer.length >= 12) {
      this.itemType1 = buffer.readUInt32BE(offset);
      offset += 4;
      this.itemType2 = buffer.readUInt32BE(offset);
      offset += 4;
      this.itemType3 = buffer.readUInt32BE(offset);
      offset += 4;
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
