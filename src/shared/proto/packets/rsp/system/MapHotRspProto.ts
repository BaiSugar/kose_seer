import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 地图在线信息
 */
export interface IMapOnlineInfo {
  mapId: number;
  onlineCount: number;
}

/**
 * [CMD: 1004 MAP_HOT] 地图热度响应
 */
export class MapHotRspProto extends BaseProto {
  maps: IMapOnlineInfo[] = [];  // 地图列表

  constructor() {
    super(CommandID.MAP_HOT);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(1024);
    
    writer.WriteUInt32(this.maps.length);
    
    for (const map of this.maps) {
      writer.WriteUInt32(map.mapId);
      writer.WriteUInt32(map.onlineCount);
    }
    
    return writer.ToBuffer();
  }

  setMaps(maps: IMapOnlineInfo[]): this {
    this.maps = maps;
    return this;
  }
}
