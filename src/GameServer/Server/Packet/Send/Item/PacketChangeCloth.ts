import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangeClothRspProto } from '../../../../../shared/proto/packets/rsp/item/ChangeClothRspProto';

/**
 * 更换服装响应包
 * CMD 2604
 */
export class PacketChangeCloth extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, clothIds: number[]) {
    super(CommandID.CHANGE_CLOTH);
    const proto = new ChangeClothRspProto(userId, clothIds);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
