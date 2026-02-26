import { BaseProto } from '../../../shared/proto';
import { Logger } from '../../../shared/utils';
import { PacketSystemMessage } from '../../Server/Packet/Send/System/PacketSystemMessage';
import { OnlineTracker } from '../Player/OnlineTracker';

export type BroadcastScope = 'map' | 'world' | 'team' | 'player';

export interface IBroadcastTarget {
  scope: BroadcastScope;
  mapId?: number;
  teamId?: number;
  userId?: number;
  excludeUserId?: number;
}

/**
 * 通用广播服务
 * - map/world/team/player 统一入口
 * - 为聊天/动作/系统通知等广播场景提供统一能力
 */
export class BroadcastService {
  private static _instance: BroadcastService;
  private _onlineTracker: OnlineTracker;

  private constructor() {
    this._onlineTracker = OnlineTracker.Instance;
  }

  public static get Instance(): BroadcastService {
    if (!BroadcastService._instance) {
      BroadcastService._instance = new BroadcastService();
    }
    return BroadcastService._instance;
  }

  /**
   * 统一广播入口
   * 返回实际发送成功数量
   */
  public async Broadcast(proto: BaseProto, target: IBroadcastTarget): Promise<number> {
    switch (target.scope) {
      case 'map':
        return this.BroadcastToMap(target.mapId || 0, proto, target.excludeUserId);
      case 'world':
        return this.BroadcastToWorld(proto, target.excludeUserId);
      case 'team':
        return this.BroadcastToTeam(target.teamId || 0, proto, target.excludeUserId);
      case 'player':
        if (!target.userId) return 0;
        return (await this.SendToPlayer(target.userId, proto)) ? 1 : 0;
      default:
        return 0;
    }
  }

  public async SendToPlayer(userId: number, proto: BaseProto): Promise<boolean> {
    if (!userId) return false;
    return this._onlineTracker.SendToPlayer(userId, proto);
  }

  public async BroadcastToMap(
    mapId: number,
    proto: BaseProto,
    excludeUserId?: number
  ): Promise<number> {
    if (mapId <= 0) return 0;
    return this._onlineTracker.BroadcastToMap(mapId, proto, excludeUserId);
  }

  public async BroadcastToWorld(proto: BaseProto, excludeUserId?: number): Promise<number> {
    let sent = 0;
    const sessions = this._onlineTracker.GetAllClients();
    for (const session of sessions) {
      if (excludeUserId !== undefined && session.UserID === excludeUserId) {
        continue;
      }
      if (!session.Player) {
        continue;
      }

      try {
        await session.Player.SendPacket(proto);
        sent++;
      } catch (error) {
        Logger.Error(`[BroadcastService] World broadcast failed: userId=${session.UserID}`, error as Error);
      }
    }

    return sent;
  }

  public async BroadcastToTeam(
    teamId: number,
    proto: BaseProto,
    excludeUserId?: number
  ): Promise<number> {
    if (teamId <= 0) return 0;

    let sent = 0;
    const sessions = this._onlineTracker.GetAllClients();
    for (const session of sessions) {
      if (excludeUserId !== undefined && session.UserID === excludeUserId) {
        continue;
      }
      if (!session.Player) {
        continue;
      }

      const playerTeamId = Number(session.Player.Data?.teamInfo?.id || 0);
      if (playerTeamId !== teamId) {
        continue;
      }

      try {
        await session.Player.SendPacket(proto);
        sent++;
      } catch (error) {
        Logger.Error(
          `[BroadcastService] Team broadcast failed: userId=${session.UserID}, teamId=${teamId}`,
          error as Error
        );
      }
    }

    return sent;
  }

  /**
   * 系统消息广播（默认全服）
   */
  public async BroadcastSystemMessage(
    message: string,
    options?: {
      npcId?: number;
      type?: number;
      scope?: BroadcastScope;
      mapId?: number;
      teamId?: number;
      userId?: number;
      excludeUserId?: number;
    }
  ): Promise<number> {
    const packet = new PacketSystemMessage(
      message,
      options?.npcId || 0,
      options?.type || 0
    );

    const target: IBroadcastTarget = {
      scope: options?.scope || 'world',
      mapId: options?.mapId,
      teamId: options?.teamId,
      userId: options?.userId,
      excludeUserId: options?.excludeUserId,
    };

    return this.Broadcast(packet, target);
  }
}

