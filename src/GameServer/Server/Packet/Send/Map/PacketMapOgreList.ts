import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MapOgreListRspProto, IOgreSlot } from '../../../../../shared/proto/packets/rsp/map/MapOgreListRspProto';

/**
 * [CMD: 2004 MAP_OGRE_LIST] 地图野怪列表响应包
 */
export class PacketMapOgreList extends BaseProto {
  private _data: Buffer;

  constructor(ogres: IOgreSlot[]) {
    super(CommandID.MAP_OGRE_LIST);
    
    const proto = new MapOgreListRspProto();
    proto.setOgres(ogres);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
