import { BaseProto } from '../../../shared/proto';
import { Logger } from '../../../shared/utils';
import { BroadcastService } from '../Broadcast/BroadcastService';
import { OnlineTracker } from '../Player/OnlineTracker';

interface IMapBroadcastOptions {
  excludeUserId?: number;
}

/**
 * 地图可见性广播服务
 * - 统一同图广播入口
 * - 统一同图玩家列表刷新入口
 */
export class MapVisibilityService {
  private _onlineTracker: OnlineTracker;
  private _broadcastService: BroadcastService;

  constructor(onlineTracker: OnlineTracker) {
    this._onlineTracker = onlineTracker;
    this._broadcastService = BroadcastService.Instance;
  }

  /**
   * 向同图玩家广播协议包
   */
  public async BroadcastToMap(
    mapId: number,
    proto: BaseProto,
    options?: IMapBroadcastOptions
  ): Promise<number> {
    if (mapId <= 0) {
      return 0;
    }

    return this._broadcastService.BroadcastToMap(
      mapId,
      proto,
      options?.excludeUserId
    );
  }

  /**
   * 刷新同图玩家列表（LIST_MAP_PLAYER）
   * 返回成功刷新的玩家数量
   */
  public async RefreshMapPlayerLists(
    mapId: number,
    options?: IMapBroadcastOptions
  ): Promise<number> {
    if (mapId <= 0) {
      return 0;
    }

    let refreshed = 0;
    const sessions = this._onlineTracker.GetClientsOnMap(mapId);
    for (const session of sessions) {
      if (options?.excludeUserId !== undefined && session.UserID === options.excludeUserId) {
        continue;
      }

      if (!session.Player) {
        Logger.Debug(
          `[MapVisibilityService] Skip refresh map=${mapId}, user=${session.UserID}, Player not ready`
        );
        continue;
      }

      await session.Player.MapManager.sendMapPlayerList(mapId);
      refreshed++;
    }

    return refreshed;
  }
}
