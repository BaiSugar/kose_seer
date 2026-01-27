import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ItemListRspProto, IItemData } from '../../../../../shared/proto/packets/rsp/item/ItemListRspProto';

/**
 * 物品列表响应包
 * CMD 2605
 */
export class PacketItemList extends BaseProto {
  private _data: Buffer;

  constructor(items: IItemData[]) {
    super(CommandID.ITEM_LIST);
    const proto = new ItemListRspProto(items);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
