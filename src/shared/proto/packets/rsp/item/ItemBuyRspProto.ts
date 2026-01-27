import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 购买物品响应
 * CMD 2601
 */
export class ItemBuyRspProto extends BaseProto {
  private cash: number;        // 剩余金币
  private itemId: number;      // 物品ID
  private itemNum: number;     // 购买数量
  private itemLevel: number;   // 物品等级

  constructor(cash: number, itemId: number, itemNum: number, itemLevel: number = 0) {
    super(CommandID.ITEM_BUY);
    this.cash = cash;
    this.itemId = itemId;
    this.itemNum = itemNum;
    this.itemLevel = itemLevel;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(16);
    let offset = 0;

    buffer.writeUInt32BE(this.cash, offset);
    offset += 4;
    buffer.writeUInt32BE(this.itemId, offset);
    offset += 4;
    buffer.writeUInt32BE(this.itemNum, offset);
    offset += 4;
    buffer.writeUInt32BE(this.itemLevel, offset);

    return buffer;
  }
}
