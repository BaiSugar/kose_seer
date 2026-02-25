import { Logger } from '../../../shared/utils';
import { OnlineTracker } from '../Player/OnlineTracker';
import { IBattleInfo } from '../../../shared/models/BattleModel';

/**
 * PVP对战邀请信息
 */
interface IPvpInvite {
  inviterId: number;
  inviterNick: string;
  targetId: number;
  targetNick: string;
  timestamp: number;
}

/**
 * PVP玩家回合动作
 */
export interface IPvpAction {
  type: 'skill' | 'changePet';
  skillId?: number;
  catchTime?: number; // 换精灵时用
}

/**
 * PVP战斗房间
 */
interface IPvpBattleRoom {
  player1Id: number;
  player2Id: number;
  battle: IBattleInfo | null;
  player1Ready: boolean;
  player2Ready: boolean;
  player1Action: IPvpAction | null;
  player2Action: IPvpAction | null;
  player1LoadPercent: number;  // 玩家1的加载进度
  player2LoadPercent: number;  // 玩家2的加载进度
  createdAt: number;
}

/**
 * PVP对战管理器（单例）
 * 管理玩家之间的对战邀请和匹配
 */
export class PvpBattleManager {
  private static _instance: PvpBattleManager;

  // 邀请列表: inviterId_targetId -> IPvpInvite
  private _invites: Map<string, IPvpInvite> = new Map();

  // 玩家的待处理邀请: userId -> inviterId[]
  private _pendingInvites: Map<number, number[]> = new Map();

  // PVP战斗房间: roomKey -> IPvpBattleRoom
  private _battleRooms: Map<string, IPvpBattleRoom> = new Map();

  // 玩家所在房间: userId -> roomKey
  private _playerRooms: Map<number, string> = new Map();

  // 邀请超时时间（毫秒）
  private readonly INVITE_TIMEOUT = 60000; // 60秒

  // 房间超时时间（毫秒）
  private readonly ROOM_TIMEOUT = 300000; // 5分钟

  private constructor() {
    // 定期清理超时邀请和房间
    setInterval(() => {
      this.CleanupExpiredInvites();
      this.CleanupExpiredRooms();
    }, 10000);
  }

  public static get Instance(): PvpBattleManager {
    if (!PvpBattleManager._instance) {
      PvpBattleManager._instance = new PvpBattleManager();
    }
    return PvpBattleManager._instance;
  }

  /**
   * 创建邀请
   */
  public CreateInvite(
    inviterId: number,
    inviterNick: string,
    targetId: number,
    targetNick: string
  ): boolean {
    // 检查目标玩家是否在线
    if (!OnlineTracker.Instance.IsOnline(targetId)) {
      Logger.Warn(`[PvpBattleManager] 目标玩家不在线: targetId=${targetId}`);
      return false;
    }

    // 检查是否已有邀请
    const key = this.GetInviteKey(inviterId, targetId);
    if (this._invites.has(key)) {
      Logger.Warn(`[PvpBattleManager] 邀请已存在: inviterId=${inviterId}, targetId=${targetId}`);
      return false;
    }

    // 创建邀请
    const invite: IPvpInvite = {
      inviterId,
      inviterNick,
      targetId,
      targetNick,
      timestamp: Date.now()
    };

    this._invites.set(key, invite);

    // 添加到待处理列表
    let pending = this._pendingInvites.get(targetId);
    if (!pending) {
      pending = [];
      this._pendingInvites.set(targetId, pending);
    }
    pending.push(inviterId);

    Logger.Info(
      `[PvpBattleManager] 创建邀请: inviterId=${inviterId}, inviterNick=${inviterNick}, ` +
      `targetId=${targetId}, targetNick=${targetNick}`
    );

    return true;
  }

  /**
   * 取消邀请
   */
  public CancelInvite(inviterId: number, targetId: number): boolean {
    const key = this.GetInviteKey(inviterId, targetId);
    const invite = this._invites.get(key);

    if (!invite) {
      Logger.Warn(`[PvpBattleManager] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
      return false;
    }

    // 移除邀请
    this._invites.delete(key);

    // 从待处理列表移除
    const pending = this._pendingInvites.get(targetId);
    if (pending) {
      const index = pending.indexOf(inviterId);
      if (index !== -1) {
        pending.splice(index, 1);
      }
      if (pending.length === 0) {
        this._pendingInvites.delete(targetId);
      }
    }

    Logger.Info(`[PvpBattleManager] 取消邀请: inviterId=${inviterId}, targetId=${targetId}`);
    return true;
  }

  /**
   * 处理邀请（接受/拒绝）
   */
  public HandleInvite(inviterId: number, targetId: number, accept: boolean): IPvpInvite | null {
    const key = this.GetInviteKey(inviterId, targetId);
    const invite = this._invites.get(key);

    if (!invite) {
      Logger.Warn(`[PvpBattleManager] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
      return null;
    }

    // 移除邀请
    this._invites.delete(key);

    // 从待处理列表移除
    const pending = this._pendingInvites.get(targetId);
    if (pending) {
      const index = pending.indexOf(inviterId);
      if (index !== -1) {
        pending.splice(index, 1);
      }
      if (pending.length === 0) {
        this._pendingInvites.delete(targetId);
      }
    }

    Logger.Info(
      `[PvpBattleManager] 处理邀请: inviterId=${inviterId}, targetId=${targetId}, accept=${accept}`
    );

    return invite;
  }

  /**
   * 创建PVP战斗房间
   */
  public CreateBattleRoom(player1Id: number, player2Id: number): string {
    const roomKey = this.GetRoomKey(player1Id, player2Id);

    // 检查是否已有房间
    if (this._battleRooms.has(roomKey)) {
      Logger.Warn(`[PvpBattleManager] 房间已存在: ${roomKey}`);
      return roomKey;
    }

    const room: IPvpBattleRoom = {
      player1Id,
      player2Id,
      battle: null,
      player1Ready: false,
      player2Ready: false,
      player1Action: null,
      player2Action: null,
      player1LoadPercent: 0,
      player2LoadPercent: 0,
      createdAt: Date.now()
    };

    this._battleRooms.set(roomKey, room);
    this._playerRooms.set(player1Id, roomKey);
    this._playerRooms.set(player2Id, roomKey);

    Logger.Info(`[PvpBattleManager] 创建战斗房间: ${roomKey}`);
    return roomKey;
  }

  /**
   * 设置玩家准备状态
   */
  public SetPlayerReady(userId: number): boolean {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) {
      Logger.Warn(`[PvpBattleManager] 玩家不在任何房间: userId=${userId}`);
      return false;
    }

    const room = this._battleRooms.get(roomKey);
    if (!room) {
      Logger.Warn(`[PvpBattleManager] 房间不存在: ${roomKey}`);
      return false;
    }

    if (room.player1Id === userId) {
      room.player1Ready = true;
    } else if (room.player2Id === userId) {
      room.player2Ready = true;
    }

    Logger.Info(`[PvpBattleManager] 玩家准备: userId=${userId}, room=${roomKey}`);
    return room.player1Ready && room.player2Ready;
  }

  /**
   * 设置玩家加载进度
   */
  public SetPlayerLoadPercent(userId: number, percent: number): void {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) return;

    const room = this._battleRooms.get(roomKey);
    if (!room) return;

    if (room.player1Id === userId) {
      room.player1LoadPercent = percent;
    } else if (room.player2Id === userId) {
      room.player2LoadPercent = percent;
    }
  }

  /**
   * 获取对方玩家的加载进度
   */
  public GetOpponentLoadPercent(userId: number): number {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) return 0;

    const room = this._battleRooms.get(roomKey);
    if (!room) return 0;

    if (room.player1Id === userId) {
      return room.player2LoadPercent;
    } else if (room.player2Id === userId) {
      return room.player1LoadPercent;
    }

    return 0;
  }

  /**
   * 获取玩家所在房间
   */
  public GetPlayerRoom(userId: number): IPvpBattleRoom | null {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) return null;
    return this._battleRooms.get(roomKey) || null;
  }

  /**
   * 设置房间战斗实例
   */
  public SetRoomBattle(roomKey: string, battle: IBattleInfo): void {
    const room = this._battleRooms.get(roomKey);
    if (room) {
      room.battle = battle;
    }
  }

  /**
   * 移除战斗房间
   */
  public RemoveBattleRoom(roomKey: string): void {
    const room = this._battleRooms.get(roomKey);
    if (room) {
      this._playerRooms.delete(room.player1Id);
      this._playerRooms.delete(room.player2Id);
      this._battleRooms.delete(roomKey);
      Logger.Info(`[PvpBattleManager] 移除战斗房间: ${roomKey}`);
    }
  }

  /**
   * 获取邀请信息
   */
  public GetInvite(inviterId: number, targetId: number): IPvpInvite | null {
    const key = this.GetInviteKey(inviterId, targetId);
    return this._invites.get(key) || null;
  }

  /**
   * 获取玩家的所有待处理邀请
   */
  public GetPendingInvites(userId: number): number[] {
    return this._pendingInvites.get(userId) || [];
  }

  /**
   * 清理超时邀请
   */
  private CleanupExpiredInvites(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, invite] of this._invites.entries()) {
      if (now - invite.timestamp > this.INVITE_TIMEOUT) {
        this._invites.delete(key);

        // 从待处理列表移除
        const pending = this._pendingInvites.get(invite.targetId);
        if (pending) {
          const index = pending.indexOf(invite.inviterId);
          if (index !== -1) {
            pending.splice(index, 1);
          }
          if (pending.length === 0) {
            this._pendingInvites.delete(invite.targetId);
          }
        }

        cleaned++;
      }
    }

    if (cleaned > 0) {
      Logger.Info(`[PvpBattleManager] 清理超时邀请: ${cleaned}个`);
    }
  }

  /**
   * 清理超时房间
   */
  private CleanupExpiredRooms(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [roomKey, room] of this._battleRooms.entries()) {
      if (now - room.createdAt > this.ROOM_TIMEOUT) {
        this.RemoveBattleRoom(roomKey);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      Logger.Info(`[PvpBattleManager] 清理超时房间: ${cleaned}个`);
    }
  }

  /**
   * 玩家登出时清理相关邀请和房间
   */
  public OnPlayerLogout(userId: number): void {
    // 清理作为邀请者的邀请
    const toRemove: string[] = [];
    for (const [key, invite] of this._invites.entries()) {
      if (invite.inviterId === userId || invite.targetId === userId) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      const invite = this._invites.get(key);
      if (invite) {
        this._invites.delete(key);

        // 从待处理列表移除
        const pending = this._pendingInvites.get(invite.targetId);
        if (pending) {
          const index = pending.indexOf(invite.inviterId);
          if (index !== -1) {
            pending.splice(index, 1);
          }
          if (pending.length === 0) {
            this._pendingInvites.delete(invite.targetId);
          }
        }
      }
    }

    // 清理待处理列表
    this._pendingInvites.delete(userId);

    // 清理战斗房间
    const roomKey = this._playerRooms.get(userId);
    if (roomKey) {
      this.RemoveBattleRoom(roomKey);
    }

    if (toRemove.length > 0) {
      Logger.Info(`[PvpBattleManager] 玩家登出，清理邀请: userId=${userId}, count=${toRemove.length}`);
    }
  }

  /**
   * 设置玩家回合动作
   * @returns true 如果双方都已提交动作
   */
  public SetPlayerAction(userId: number, action: IPvpAction): boolean {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) {
      Logger.Warn(`[PvpBattleManager] 设置动作失败，玩家不在房间: userId=${userId}`);
      return false;
    }

    const room = this._battleRooms.get(roomKey);
    if (!room) {
      Logger.Warn(`[PvpBattleManager] 设置动作失败，房间不存在: ${roomKey}`);
      return false;
    }

    if (room.player1Id === userId) {
      room.player1Action = action;
    } else if (room.player2Id === userId) {
      room.player2Action = action;
    } else {
      return false;
    }

    Logger.Info(`[PvpBattleManager] 玩家提交动作: userId=${userId}, type=${action.type}, skillId=${action.skillId || 0}`);
    return room.player1Action !== null && room.player2Action !== null;
  }

  /**
   * 获取双方动作
   */
  public GetActions(userId: number): { player1Action: IPvpAction; player2Action: IPvpAction; player1Id: number; player2Id: number } | null {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) return null;

    const room = this._battleRooms.get(roomKey);
    if (!room || !room.player1Action || !room.player2Action) return null;

    return {
      player1Action: room.player1Action,
      player2Action: room.player2Action,
      player1Id: room.player1Id,
      player2Id: room.player2Id
    };
  }

  /**
   * 清空双方动作（回合结算后调用）
   */
  public ClearActions(userId: number): void {
    const roomKey = this._playerRooms.get(userId);
    if (!roomKey) return;

    const room = this._battleRooms.get(roomKey);
    if (!room) return;

    room.player1Action = null;
    room.player2Action = null;
    Logger.Debug(`[PvpBattleManager] 清空回合动作: room=${roomKey}`);
  }

  /**
   * 生成邀请键
   */
  private GetInviteKey(inviterId: number, targetId: number): string {
    return `${inviterId}_${targetId}`;
  }

  /**
   * 生成房间键
   */
  private GetRoomKey(player1Id: number, player2Id: number): string {
    // 确保键的唯一性（小ID在前）
    const [id1, id2] = player1Id < player2Id ? [player1Id, player2Id] : [player2Id, player1Id];
    return `${id1}_${id2}`;
  }
}
