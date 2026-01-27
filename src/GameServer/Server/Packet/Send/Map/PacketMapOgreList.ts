import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MapOgreListRspProto } from '../../../../../shared/proto/packets/rsp/map/MapOgreListRspProto';

/**
 * 地图怪物列表响应包
 * CMD 1004
 */
export class PacketMapOgreList extends BaseProto {
  private _data: Buffer;

  constructor(ogres: Array<{ petId: number; shiny: number }>) {
    super(CommandID.MAP_OGRE_LIST);
    const proto = new MapOgreListRspProto();
    proto.ogres = ogres;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
