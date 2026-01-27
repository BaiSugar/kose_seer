import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MapHotRspProto } from '../../../../../shared/proto/packets/rsp/system/MapHotRspProto';

/**
 * 地图热度响应包
 * CMD 1004
 */
export class PacketMapHot extends BaseProto {
  private _data: Buffer;

  constructor(maps: Array<{ mapId: number; onlineCount: number }>) {
    super(CommandID.MAP_HOT);
    const proto = new MapHotRspProto();
    proto.maps = maps;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
