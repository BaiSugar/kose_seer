import { IClientSession } from '../../Server/Packet/IHandler';
import { Logger } from '../../../shared/utils';
import { BaseProto } from '../../../shared/proto';

/**
 * 在线玩家追踪系统
 * 追踪玩家所在地图，提供实时在线人数统计和广播功能
 */

interface IOnlinePlayer {
  userId: number;
  mapId: number;
  mapType: number;
  loginTime: number;
  lastActive: number;
  session: IClientSession;
}

export class OnlineTracker {
  private static _instance: OnlineTracker;
  
  // 在线玩家表: userId -> IOnlinePlayer
  private _onlinePlayers: Map<number, IOnlinePlayer> = new Map();
  
  // 地图玩家计数缓存: mapId -> count
  private _mapPlayerCount: Map<number, number> = new Map();
  
  // 地图玩家列表: mapId -> Set<userId>
  private _mapPlayers: Map<number, Set<number>> = new Map();

  private constructor() {}

  public static get Instance(): OnlineTracker {
    if (!OnlineTracker._instance) {
      OnlineTracker._instance = new OnlineTracker();
    }
    return OnlineTracker._instance;
  }

  /**
   * 记录玩家上线
   */
  public PlayerLogin(userId: number, session: IClientSession): void {
    if (!this._onlinePlayers.has(userId)) {
      this._onlinePlayers.set(userId, {
        userId,
        mapId: 0,
        mapType: 0,
        loginTime: Date.now(),
        lastActive: Date.now(),
        session
      });
      Logger.Info(`[OnlineTracker] 玩家 ${userId} 上线`);
    } else {
      // 更新连接
      const player = this._onlinePlayers.get(userId)!;
      player.session = session;
      player.lastActive = Date.now();
    }
  }

  /**
   * 记录玩家下线
   */
  public PlayerLogout(userId: number): void {
    const player = this._onlinePlayers.get(userId);
    if (player && player.mapId > 0) {
      // 从旧地图移除
      this.removeFromMap(userId, player.mapId);
    }
    this._onlinePlayers.delete(userId);
    Logger.Info(`[OnlineTracker] 玩家 ${userId} 下线`);
  }

  /**
   * 更新玩家所在地图
   */
  public UpdatePlayerMap(userId: number, newMapId: number, mapType: number = 0): void {
    let player = this._onlinePlayers.get(userId);
    if (!player) {
      Logger.Warn(`[OnlineTracker] 玩家 ${userId} 不在线，无法更新地图`);
      return;
    }

    const oldMapId = player.mapId;

    // 从旧地图移除
    if (oldMapId > 0 && oldMapId !== newMapId) {
      this.removeFromMap(userId, oldMapId);
    }

    // 添加到新地图
    if (newMapId > 0 && oldMapId !== newMapId) {
      this.addToMap(userId, newMapId);
    }

    // 更新玩家信息
    player.mapId = newMapId;
    player.mapType = mapType;
    player.lastActive = Date.now();

    Logger.Info(`[OnlineTracker] 玩家 ${userId} 进入地图 ${newMapId} (旧地图: ${oldMapId})`);
  }

  /**
   * 从地图移除玩家
   */
  private removeFromMap(userId: number, mapId: number): void {
    const players = this._mapPlayers.get(mapId);
    if (players) {
      players.delete(userId);
      if (players.size === 0) {
        this._mapPlayers.delete(mapId);
        this._mapPlayerCount.delete(mapId);
      } else {
        this._mapPlayerCount.set(mapId, players.size);
      }
    }
  }

  /**
   * 添加玩家到地图
   */
  private addToMap(userId: number, mapId: number): void {
    let players = this._mapPlayers.get(mapId);
    if (!players) {
      players = new Set();
      this._mapPlayers.set(mapId, players);
    }
    players.add(userId);
    this._mapPlayerCount.set(mapId, players.size);
  }

  /**
   * 获取地图在线人数
   */
  public GetMapPlayerCount(mapId: number): number {
    return this._mapPlayerCount.get(mapId) || 0;
  }

  /**
   * 获取所有有人的地图及人数
   */
  public GetAllMapCounts(): Array<{ mapId: number; count: number }> {
    const result: Array<{ mapId: number; count: number }> = [];
    for (const [mapId, count] of this._mapPlayerCount.entries()) {
      if (count > 0) {
        result.push({ mapId, count });
      }
    }
    // 按人数降序排序
    result.sort((a, b) => b.count - a.count);
    return result;
  }

  /**
   * 获取在线玩家总数
   */
  public GetOnlineCount(): number {
    return this._onlinePlayers.size;
  }

  /**
   * 获取玩家当前地图
   */
  public GetPlayerMap(userId: number): number {
    const player = this._onlinePlayers.get(userId);
    return player ? player.mapId : 0;
  }

  /**
   * 获取指定地图的所有玩家ID
   */
  public GetPlayersInMap(mapId: number): number[] {
    const players = this._mapPlayers.get(mapId);
    return players ? Array.from(players) : [];
  }

  /**
   * 广播消息给指定地图的所有玩家
   */
  public async BroadcastToMap(
    mapId: number,
    proto: BaseProto,
    excludeUserId?: number
  ): Promise<number> {
    const playerIds = this.GetPlayersInMap(mapId);
    let sent = 0;

    for (const userId of playerIds) {
      if (userId === excludeUserId) continue;

      const player = this._onlinePlayers.get(userId);
      if (player?.session?.Player) {
        try {
          await player.session.Player.SendPacket(proto);
          sent++;
        } catch (err) {
          Logger.Error(`[OnlineTracker] 广播失败 userId=${userId}`, err as Error);
        }
      }
    }

    return sent;
  }

  /**
   * 发送消息给指定玩家
   */
  public async SendToPlayer(userId: number, proto: BaseProto): Promise<boolean> {
    const player = this._onlinePlayers.get(userId);
    if (player?.session?.Player) {
      try {
        await player.session.Player.SendPacket(proto);
        return true;
      } catch (err) {
        Logger.Error(`[OnlineTracker] 发送失败 userId=${userId}`, err as Error);
        return false;
      }
    }
    return false;
  }

  /**
   * 检查玩家是否在线
   */
  public IsOnline(userId: number): boolean {
    return this._onlinePlayers.has(userId);
  }

  /**
   * 更新玩家活跃时间
   */
  public UpdateActivity(userId: number): void {
    const player = this._onlinePlayers.get(userId);
    if (player) {
      player.lastActive = Date.now();
    }
  }

  /**
   * 清理超时玩家 (超过指定秒数无活动)
   */
  public CleanupInactive(timeoutSeconds: number = 300): number {
    const now = Date.now();
    const timeout = timeoutSeconds * 1000;
    let removed = 0;

    for (const [userId, player] of this._onlinePlayers.entries()) {
      if (now - player.lastActive > timeout) {
        this.PlayerLogout(userId);
        removed++;
      }
    }

    if (removed > 0) {
      Logger.Warn(`[OnlineTracker] 清理了 ${removed} 个超时玩家`);
    }

    return removed;
  }

  /**
   * 获取玩家Session
   */
  public GetPlayerSession(userId: number): IClientSession | null {
    const player = this._onlinePlayers.get(userId);
    return player ? player.session : null;
  }
}
