import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ListMapPlayerRspProto } from '../../../../../shared/proto/packets/rsp/map/ListMapPlayerRspProto';
import { SeerMapUserInfoProto } from '../../../../../shared/proto/common/SeerMapUserInfoProto';

/**
 * 地图玩家列表响应包
 * CMD 1003
 */
export class PacketListMapPlayer extends BaseProto {
  private _data: Buffer;

  constructor(players: SeerMapUserInfoProto[]) {
    super(CommandID.LIST_MAP_PLAYER);
    const proto = new ListMapPlayerRspProto();
    proto.players = players;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
