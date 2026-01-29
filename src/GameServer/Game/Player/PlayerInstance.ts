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
import { FriendManager } from '../Friend/FriendManager';
import { TaskManager } from '../Task/TaskManager';
import { PlayerRepository } from '../../../DataBase/repositories/Player/PlayerRepository';
import { PlayerData } from '../../../DataBase/models/PlayerData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';

/**
 * 玩家实例
 * 管理单个玩家的所有数据和Manager
 * 
 * 架构原则：
 * - 每个在线玩家对应一个 PlayerInstance
 * - 包含各种 Manager（ItemManager、MapManager、PetManager等）
 * - 提供 SendPacket 方法用于发送数据包
 * - Manager 随 Player 实例自动创建和销毁
 * - 通过 Data 属性直接访问玩家数据
 * - Manager 持有自己的 Data 对象（如 FriendManager.FriendData）
 * - 不使用 Repository 包装器，直接操作 Data 对象
 */
export class PlayerInstance {
  // ===== 核心属性 =====
  private _session: IClientSession;
  private _packetBuilder: PacketBuilder;
  private _playerRepo: PlayerRepository; // 仅用于初始化加载
  
  public Uid: number;  // 用户ID
  public Initialized: boolean = false;  // 是否已初始化

  // ===== 数据对象=====
  public Data!: PlayerData;  // 玩家数据

  // ===== Managers =====
  public ItemManager: ItemManager;
  public MapManager: MapManager;
  public PetManager: PetManager;
  public SystemManager: SystemManager;
  public NoNoManager: NoNoManager;
  public BattleManager: BattleManager;
  public MailManager: MailManager;
  public FriendManager: FriendManager;
  public TaskManager: TaskManager;

  constructor(session: IClientSession, userID: number, packetBuilder: PacketBuilder) {
    this._session = session;
    this.Uid = userID;
    this._packetBuilder = packetBuilder;
    this._playerRepo = new PlayerRepository();

    // 初始化所有 Manager
    this.ItemManager = new ItemManager(this);
    this.MapManager = new MapManager(this);
    this.PetManager = new PetManager(this);
    this.SystemManager = new SystemManager(this);
    this.NoNoManager = new NoNoManager(this);
    this.BattleManager = new BattleManager(this);
    this.MailManager = new MailManager(this);
    this.FriendManager = new FriendManager(this);
    this.TaskManager = new TaskManager(this);
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
   */
  public async SendPacket(proto: BaseProto): Promise<void> {
    try {
      const cmdId = proto.getCmdId();
      const result = proto.getResult();
      const bodyData = proto.serialize();
      
      const packet = this._packetBuilder.Build(
        cmdId,
        this.Uid,
        result,
        bodyData
      );
      
      this._session.Socket.write(packet);
      Logger.Info(`[Player ${this.Uid}] 发送数据包: cmdId=${cmdId}, result=${result}, bodyLen=${bodyData.length}, packetLen=${packet.length}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[Player ${this.Uid}] 发送数据包失败`, error);
    }
  }

  /**
   * 玩家登录
   */
  public async OnLogin(): Promise<void> {
    Logger.Info(`[Player ${this.Uid}] 玩家登录: ${this.Data.nick}`);
    
    // 注意：不在这里调用NoNoManager.OnLogin()
    // 原因：
    // 1. 如果玩家有NoNo，客户端会根据登录响应中的hasNono字段主动请求NoNo信息或召唤
    // 2. 如果玩家没有NoNo，不需要任何处理
    // 3. 服务器不应该主动推送NoNo信息
  }

  /**
   * 玩家登出
   */
  public async OnLogout(): Promise<void> {
    Logger.Info(`[Player ${this.Uid}] 玩家登出: ${this.Data.nick}`);
    
    // 实时保存该玩家的所有数据
    await DatabaseHelper.Instance.SaveUser(this.Uid);
    
    // 清理 BattleManager
    await this.BattleManager.OnLogout();
    
    // 清理Session中的Player引用
    this._session.Player = undefined;
    
    // 移除缓存
    DatabaseHelper.Instance.RemoveCache(this.Uid);
  }

  /**
   * 初始化玩家数据
   */
  public async Initialize(): Promise<void> {
    // 加载玩家数据（通过 DatabaseHelper）
    this.Data = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PlayerData(this.Uid);
    
    Logger.Info(`[PlayerInstance] 玩家数据已加载 userId=${this.Uid}, nickname=${this.Data.nick}`);
    
    // 初始化所有 Manager（加载各自的 Data）
    await this.ItemManager.Initialize();
    await this.PetManager.Initialize();
    await this.MailManager.Initialize();
    await this.FriendManager.Initialize();
    await this.TaskManager.Initialize();
    await this.NoNoManager.Initialize();
    
    this.Initialized = true;
  }

  // ===== 便捷方法 =====

  /**
   * 更新玩家昵称
   */
  public async UpdateNickname(newNick: string): Promise<boolean> {
    const success = await this._playerRepo.UpdateNickname(this.Uid, newNick);
    if (success) {
      this.Data.nick = newNick;
    }
    return success;
  }

  /**
   * 添加货币
   */
  public async AddCurrency(energy?: number, coins?: number): Promise<boolean> {
    const success = await this._playerRepo.AddCurrency(this.Uid, energy, coins);
    if (success) {
      if (energy !== undefined) this.Data.energy += energy;
      if (coins !== undefined) this.Data.coins += coins;
    }
    return success;
  }

  /**
   * 更新位置
   */
  public async UpdatePosition(mapId: number, posX: number, posY: number): Promise<boolean> {
    const success = await this._playerRepo.UpdatePosition(this.Uid, mapId, posX, posY);
    if (success) {
      this.Data.mapID = mapId;
      this.Data.posX = posX;
      this.Data.posY = posY;
    }
    return success;
  }
}
