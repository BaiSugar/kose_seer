import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PeopleTransformRspProto } from '../../../../../shared/proto/packets/rsp/map/PeopleTransformRspProto';

/**
 * 玩家变身响应包
 * CMD 1011
 */
export class PacketPeopleTransform extends BaseProto {
  private _data: Buffer;

  constructor(userId: number, transId: number) {
    super(CommandID.PEOPLE_TRANSFROM);
    const proto = new PeopleTransformRspProto();
    proto.userId = userId;
    proto.transId = transId;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
