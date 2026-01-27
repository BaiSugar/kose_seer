import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ItemBuyRspProto } from '../../../../../shared/proto/packets/rsp/item/ItemBuyRspProto';

/**
 * 购买物品响应包
 * CMD 2601
 */
export class PacketItemBuy extends BaseProto {
  private _data: Buffer;

  constructor(cash: number, itemId: number, itemNum: number, itemLevel: number = 0) {
    super(CommandID.ITEM_BUY);
    const proto = new ItemBuyRspProto(cash, itemId, itemNum, itemLevel);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
