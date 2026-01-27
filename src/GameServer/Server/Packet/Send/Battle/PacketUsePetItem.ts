import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { UsePetItemRspProto } from '../../../../../shared/proto/packets/rsp/battle/UsePetItemRspProto';

/**
 * 使用精灵道具包
 * CMD 2406
 */
export class PacketUsePetItem extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, itemId: number, hp: number, change: number) {
    super(CommandID.USE_PET_ITEM);
    
    const proto = new UsePetItemRspProto();
    proto.setUserId(userId);
    proto.setItemId(itemId);
    proto.setHP(hp, change);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
