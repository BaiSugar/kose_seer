import { PlayerInstance } from './PlayerInstance';
import { IClientSession } from '../../Server/Packet/IHandler';
import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { Logger } from '../../../shared/utils';
import { OnlineTracker } from './OnlineTracker';

/**
 * 玩家管理器
 * 管理所有在线玩家
 */
export class PlayerManager {
  private static _instance: PlayerManager;
  private _players: Map<number, PlayerInstance> = new Map();
  private _packetBuilder: PacketBuilder;

  private constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 获取单例实例
   */
  public static GetInstance(packetBuilder?: PacketBuilder): PlayerManager {
    if (!PlayerManager._instance) {
      if (!packetBuilder) {
        throw new Error('PacketBuilder is required for first initialization');
      }
      PlayerManager._instance = new PlayerManager(packetBuilder);
    }
    return PlayerManager._instance;
  }

  /**
   * 创建玩家实例
   */
  public async CreatePlayer(session: IClientSession, userID: number, nickname: string): Promise<PlayerInstance> {
    // 如果玩家已存在，先移除旧的
    if (this._players.has(userID)) {
      Logger.Warn(`[PlayerManager] 玩家已存在，移除旧实例: ${userID}`);
      await this.RemovePlayer(userID);
    }

    // 创建新的玩家实例（不再需要传 nickname）
    const player = new PlayerInstance(session, userID, this._packetBuilder);
    await player.Initialize();

    // 添加到管理器
    this._players.set(userID, player);
    
    // 设置到Session
    session.Player = player;

    // 注册到在线追踪系统
    OnlineTracker.Instance.PlayerLogin(userID, session);

    Logger.Info(`[PlayerManager] 创建玩家实例: userID=${userID}, nickname=${nickname}`);
    return player;
  }

  /**
   * 获取玩家实例
   */
  public GetPlayer(userID: number): PlayerInstance | undefined {
    return this._players.get(userID);
  }

  /**
   * 移除玩家实例
   */
  public async RemovePlayer(userID: number): Promise<void> {
    const player = this._players.get(userID);
    if (player) {
      await player.OnLogout();
      this._players.delete(userID);
      
      // 从在线追踪系统移除
      OnlineTracker.Instance.PlayerLogout(userID);
      
      Logger.Info(`[PlayerManager] 移除玩家实例: ${userID}`);
    }
  }

  /**
   * 获取在线玩家数量
   */
  public GetOnlineCount(): number {
    return this._players.size;
  }

  /**
   * 获取所有在线玩家
   */
  public GetAllPlayers(): PlayerInstance[] {
    return Array.from(this._players.values());
  }

  /**
   * 检查玩家是否在线
   */
  public IsPlayerOnline(userID: number): boolean {
    return this._players.has(userID);
  }
}
