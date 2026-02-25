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
  posX: number;        // 实时X坐标
  posY: number;        // 实时Y坐标
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
  
  // 地图玩家列表: mapId -> Map<userId, session>
  // 以该结构作为“地图在线成员”的唯一权威来源（对齐 go-server 的 MapUsers 机制）
  private _mapUsers: Map<number, Map<number, IClientSession>> = new Map();

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
        posX: 500,
        posY: 300,
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

      // 如果该玩家已在某地图，更新权威成员表中的 session 引用（避免广播到旧连接）
      if (player.mapId > 0) {
        this.AddUserToMap(player.mapId, userId, session);
      }
    }
  }

  /**
   * 记录玩家下线
   */
  public PlayerLogout(userId: number): void {
    const player = this._onlinePlayers.get(userId);
    if (player && player.mapId > 0) {
      // 从旧地图移除
      this.RemoveUserFromMap(player.mapId, userId);
    }
    this._onlinePlayers.delete(userId);
    Logger.Info(`[OnlineTracker] 玩家 ${userId} 下线`);
  }

  /**
   * 将用户加入地图（权威成员表）
   */
  public AddUserToMap(mapId: number, userId: number, session: IClientSession): void {
    if (mapId <= 0) return;
    let m = this._mapUsers.get(mapId);
    if (!m) {
      m = new Map<number, IClientSession>();
      this._mapUsers.set(mapId, m);
    }
    m.set(userId, session);
    this._mapPlayerCount.set(mapId, m.size);
  }

  /**
   * 将用户从地图移除（权威成员表）
   */
  public RemoveUserFromMap(mapId: number, userId: number): void {
    if (mapId <= 0) return;
    const m = this._mapUsers.get(mapId);
    if (!m) return;
    m.delete(userId);
    if (m.size === 0) {
      this._mapUsers.delete(mapId);
      this._mapPlayerCount.delete(mapId);
    } else {
      this._mapPlayerCount.set(mapId, m.size);
    }
  }

  /**
   * 返回指定地图上的所有 Session（快照）
   */
  public GetClientsOnMap(mapId: number): IClientSession[] {
    const m = this._mapUsers.get(mapId);
    return m ? Array.from(m.values()) : [];
  }

  /**
   * 更新玩家所在地图
   */
  public UpdatePlayerMap(userId: number, newMapId: number, mapType: number = 0, posX: number = 500, posY: number = 300): void {
    let player = this._onlinePlayers.get(userId);
    if (!player) {
      Logger.Warn(`[OnlineTracker] 玩家 ${userId} 不在线，无法更新地图`);
      return;
    }

    const oldMapId = player.mapId;

    // 从旧地图移除
    if (oldMapId > 0 && oldMapId !== newMapId) {
      this.RemoveUserFromMap(oldMapId, userId);
    }

    // 添加到新地图
    if (newMapId > 0 && oldMapId !== newMapId) {
      this.AddUserToMap(newMapId, userId, player.session);
    }

    // 更新玩家信息（包括位置）
    player.mapId = newMapId;
    player.mapType = mapType;
    player.posX = posX;
    player.posY = posY;
    player.lastActive = Date.now();

    Logger.Info(`[OnlineTracker] 玩家 ${userId} 进入地图 ${newMapId} (旧地图: ${oldMapId})`);
  }

  /**
   * 从地图移除玩家
   */
  private removeFromMap(userId: number, mapId: number): void {
    // legacy: 保持空实现以避免旧调用崩溃（已迁移到 RemoveUserFromMap）
    this.RemoveUserFromMap(mapId, userId);
  }

  /**
   * 添加玩家到地图
   */
  private addToMap(userId: number, mapId: number): void {
    // legacy: 保持空实现以避免旧调用崩溃（已迁移到 AddUserToMap）
    const p = this._onlinePlayers.get(userId);
    if (p) {
      this.AddUserToMap(mapId, userId, p.session);
    }
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
   * 获取玩家当前位置
   */
  public GetPlayerPosition(userId: number): { x: number; y: number } | null {
    const player = this._onlinePlayers.get(userId);
    return player ? { x: player.posX, y: player.posY } : null;
  }

  /**
   * 获取指定地图的所有玩家ID
   */
  public GetPlayersInMap(mapId: number): number[] {
    const m = this._mapUsers.get(mapId);
    return m ? Array.from(m.keys()) : [];
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
    Logger.Debug(`[OnlineTracker] BroadcastToMap: mapId=${mapId}, excludeUserId=${excludeUserId}, playerIds=${playerIds.join(',')}`);
    let sent = 0;

    const sessions = this.GetClientsOnMap(mapId);
    for (const session of sessions) {
      const uid = session.UserID;
      if (excludeUserId !== undefined && uid === excludeUserId) continue;
      Logger.Debug(`[OnlineTracker] 广播检查: userId=${uid}, hasSession=${!!session}, hasSessionPlayer=${!!session?.Player}, sessionType=${session?.Type}`);
      if (session?.Player) {
        try {
          await session.Player.SendPacket(proto);
          sent++;
        } catch (err) {
          Logger.Error(`[OnlineTracker] 广播失败 userId=${uid}`, err as Error);
        }
      } else {
        Logger.Warn(`[OnlineTracker] 广播跳过 userId=${uid}, 原因: session或Player为空`);
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
