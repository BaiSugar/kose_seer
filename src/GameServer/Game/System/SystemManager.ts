import { BaseManager } from '../Base/BaseManager';
import { PacketMapHot } from '../../Server/Packet/Send/System/PacketMapHot';
import { OnlineTracker } from '../Player/OnlineTracker';
import { Logger } from '../../../shared/utils';

/**
 * 系统管理器
 * 处理系统相关的复杂业务逻辑
 */
export class SystemManager extends BaseManager {
  // 官方地图列表
  private static readonly OFFICIAL_MAPS = [
    1, 4, 5, 325, 6, 7, 8, 328, 9, 10,
    333, 15, 17, 338, 19, 20, 25, 30,
    101, 102, 103, 40, 107, 47, 51, 54, 57, 314, 60
  ];

  /**
   * 处理获取地图热度
   * 复杂逻辑：需要查询所有地图的在线人数
   */
  public async HandleMapHot(): Promise<void> {
    // 获取所有地图的在线人数
    const mapCounts = OnlineTracker.Instance.GetAllMapCounts();
    const mapOnlineMap = new Map<number, number>();
    
    for (const { mapId, count } of mapCounts) {
      mapOnlineMap.set(mapId, count);
    }

    // 构建官方地图列表
    const maps: Array<{ mapId: number; onlineCount: number }> = [];
    for (const mapId of SystemManager.OFFICIAL_MAPS) {
      maps.push({
        mapId,
        onlineCount: mapOnlineMap.get(mapId) || 0
      });
    }

    await this.Player.SendPacket(new PacketMapHot(maps));
    
    const totalOnline = OnlineTracker.Instance.GetOnlineCount();
    Logger.Info(`[SystemManager] 发送地图热度，共 ${maps.length} 个地图，总在线 ${totalOnline} 人`);
  }
}
