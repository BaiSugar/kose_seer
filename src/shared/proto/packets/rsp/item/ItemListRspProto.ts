import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 物品信息接口
 */
export interface IItemData {
  itemId: number;
  count: number;
  expireTime: number;
  unknown: number;
}

/**
 * 物品列表响应
 * CMD 2605
 */
export class ItemListRspProto extends BaseProto {
  private items: IItemData[];

  constructor(items: IItemData[]) {
    super(CommandID.ITEM_LIST);
    this.items = items;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4 + this.items.length * 16);
    let offset = 0;

    buffer.writeUInt32BE(this.items.length, offset);
    offset += 4;

    for (const item of this.items) {
      buffer.writeUInt32BE(item.itemId, offset);
      offset += 4;
      buffer.writeUInt32BE(item.count, offset);
      offset += 4;
      buffer.writeUInt32BE(item.expireTime, offset);
      offset += 4;
      buffer.writeUInt32BE(item.unknown, offset);
      offset += 4;
    }

    return buffer;
  }
}
