import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MapBossRspProto, IBossInfo } from '../../../../../shared/proto/packets/rsp/map/MapBossRspProto';

/**
 * [CMD: 2021 MAP_BOSS] 地图BOSS列表响应包
 */
export class PacketMapBoss extends BaseProto {
  private _data: Buffer;

  constructor(bosses: IBossInfo[]) {
    super(CommandID.MAP_BOSS);
    
    const proto = new MapBossRspProto();
    proto.setBosses(bosses);
    
    this._data = proto.serialize();
  }

  serialize(): Buffer {
    return this._data;
  }
}
