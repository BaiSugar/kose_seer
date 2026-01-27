import { IClientSession } from '../../Server/Packet/IHandler';
import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { Logger } from '../../../shared/utils';
import { BaseProto } from '../../../shared/proto';
import { ItemManager } from '../Item/ItemManager';
import { MapManager } from '../Map/MapManager';
import { PetManager } from '../Pet/PetManager';
import { SystemManager } from '../System/SystemManager';
import { NoNoManager } from '../NoNo/NoNoManager';
import { BattleManager } from '../Battle/BattleManager';
import { MailManager } from '../Mail/MailManager';
import { 
  PlayerItemRepository, 
  PlayerPetRepository, 
  PlayerMailRepository, 
  PlayerInfoRepository 
} from './PlayerRepositoryWrapper';

/**
 * 玩家实例
 * 管理单个玩家的所有数据和Manager
 * 
 * 架构原则：
 * - 每个在线玩家对应一个 PlayerInstance
 * - 包含各种 Manager（ItemManager、MapManager、PetManager等）
 * - 提供 SendPacket 方法用于发送数据包
 * - Manager 随 Player 实例自动创建和销毁
 * - 通过 Repository 包装器统一数据访问（自动注入 userId）
 */
export class PlayerInstance {
  private _session: IClientSession;
  private _packetBuilder: PacketBuilder;
  private _userID: number;
  private _nickname: string;

  // ===== Repository 包装器 =====
  public ItemRepo: PlayerItemRepository;
  public PetRepo: PlayerPetRepository;
  public MailRepo: PlayerMailRepository;
  public PlayerRepo: PlayerInfoRepository;

  // ===== Managers =====
  public ItemManager: ItemManager;
  public MapManager: MapManager;
  public PetManager: PetManager;
  public SystemManager: SystemManager;
  public NoNoManager: NoNoManager;
  public BattleManager: BattleManager;
  public MailManager: MailManager;
  // public FriendManager: FriendManager;

  constructor(session: IClientSession, userID: number, nickname: string, packetBuilder: PacketBuilder) {
    this._session = session;
    this._userID = userID;
    this._nickname = nickname;
    this._packetBuilder = packetBuilder;

    // 初始化 Repository 包装器
    this.ItemRepo = new PlayerItemRepository(userID);
    this.PetRepo = new PlayerPetRepository(userID);
    this.MailRepo = new PlayerMailRepository(userID);
    this.PlayerRepo = new PlayerInfoRepository(userID);

    // 初始化所有 Manager
    this.ItemManager = new ItemManager(this);
    this.MapManager = new MapManager(this);
    this.PetManager = new PetManager(this);
    this.SystemManager = new SystemManager(this);
    this.NoNoManager = new NoNoManager(this);
    this.BattleManager = new BattleManager(this);
    this.MailManager = new MailManager(this);
    // this.FriendManager = new FriendManager(this);
  }

  /**
   * 获取用户ID
   */
  public get UserID(): number {
    return this._userID;
  }

  /**
   * 获取昵称
   */
  public get Nickname(): string {
    return this._nickname;
  }

  /**
   * 设置昵称（内部使用）
   */
  public set Nickname(value: string) {
    this._nickname = value;
  }

  /**
   * 获取Session
   */
  public get Session(): IClientSession {
    return this._session;
  }

  /**
   * 发送数据包
   * @param proto Proto对象（自动获取cmdId和result）
   * 
   * @example
   * // 发送成功响应
   * await player.SendPacket(new LoginRspProto());
   * 
   * // 发送失败响应
   * await player.SendPacket(new LoginRspProto().setResult(5001));
   * 
   * // 链式调用
   * await player.SendPacket(
   *   new LoginRspProto()
   *     .setNickname("玩家名")
   *     .setSession(sessionKey)
   * );
   */
  public async SendPacket(proto: BaseProto): Promise<void> {
    try {
      const cmdId = proto.getCmdId();
      const result = proto.getResult();
      
      const packet = this._packetBuilder.Build(
        cmdId,
        this._userID,
        result,
        proto.serialize()
      );
      this._session.Socket.write(packet);
      Logger.Debug(`[Player ${this._userID}] 发送数据包: cmdId=${cmdId}, result=${result}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[Player ${this._userID}] 发送数据包失败`, error);
    }
  }

  /**
   * 玩家登出
   */
  public async OnLogout(): Promise<void> {
    Logger.Info(`[Player ${this._userID}] 玩家登出: ${this._nickname}`);
    
    // 清理所有 Manager
    await this.ItemManager.OnLogout();
    await this.MapManager.OnLogout();
    await this.PetManager.OnLogout();
    await this.SystemManager.OnLogout();
    await this.NoNoManager.OnLogout();
    // await this.BattleManager.OnLogout();
    // await this.FriendManager.OnLogout();
    // await this.MailManager.OnLogout();
    
    // 清理Session中的Player引用
    this._session.Player = undefined;
  }

  /**
   * 初始化玩家数据
   */
  public async Initialize(): Promise<void> {
    await this.PlayerRepo.Load();
    Logger.Info(`[PlayerInstance] 玩家数据已加载 userId=${this._userID}, nickname=${this.PlayerRepo.data.nick}`);
    
    // 初始化所有 Manager
    await this.ItemManager.Initialize();
    await this.MapManager.Initialize();
    await this.PetManager.Initialize();
    await this.SystemManager.Initialize();
    await this.NoNoManager.Initialize();
    // await this.BattleManager.Initialize();
    // await this.FriendManager.Initialize();
    // await this.MailManager.Initialize();
  }
}
