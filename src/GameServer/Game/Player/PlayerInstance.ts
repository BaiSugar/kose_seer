import { IClientSession } from '../../Server/Packet/IHandler';
import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { Logger } from '../../../shared/utils';
import { BaseProto } from '../../../shared/proto';
import { ItemManager } from '../Item/ItemManager';
import { MapManager } from '../Map/MapManager';
import { MapActionManager } from '../Map/MapActionManager';
import { MapBroadcastManager } from '../Map/MapBroadcastManager';
import { MapSpawnManager } from '../Map/MapSpawnManager';
import { PetManager } from '../Pet/PetManager';
import { SystemManager } from '../System/SystemManager';
import { NoNoManager } from '../NoNo/NoNoManager';
import { BattleManager } from '../Battle/BattleManager';
import { MailManager } from '../Mail/MailManager';
import { FriendManager } from '../Friend/FriendManager';
import { TaskManager } from '../Task/TaskManager';
import { ChallengeProgressManager } from '../Challenge/ChallengeProgressManager';
import { GachaManager } from '../Gacha/GachaManager';
import { PlayerRepository } from '../../../DataBase/repositories/Player/PlayerRepository';
import { PlayerData } from '../../../DataBase/models/PlayerData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { GameEventBus } from '../Event/GameEventBus';
import { PlayerEventType, IPlayerLoginEvent, IPlayerLogoutEvent } from '../Event/EventTypes';

/**
 * 玩家实例
 * 管理单个玩家的所有数据和 Manager
 *
 * 架构原则：
 * - 每个在线玩家对应一个 PlayerInstance
 * - 包含各种 Manager（ItemManager、MapManager、PetManager 等）
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

  public Uid: number; // 用户ID
  public Initialized: boolean = false; // 是否已初始化

  // ===== 数据对象 =====
  public Data!: PlayerData; // 玩家数据

  // ===== Managers =====
  public ItemManager: ItemManager;
  public MapManager: MapManager;
  public MapActionManager: MapActionManager;
  public MapBroadcastManager: MapBroadcastManager;
  public MapSpawnManager: MapSpawnManager;
  public PetManager: PetManager;
  public SystemManager: SystemManager;
  public NoNoManager: NoNoManager;
  public BattleManager: BattleManager;
  public MailManager: MailManager;
  public FriendManager: FriendManager;
  public TaskManager: TaskManager;
  public ChallengeProgressManager: ChallengeProgressManager;
  public GachaManager: GachaManager;
  public EventBus: GameEventBus;

  constructor(session: IClientSession, userID: number, packetBuilder: PacketBuilder) {
    this._session = session;
    this.Uid = userID;
    this._packetBuilder = packetBuilder;
    this._playerRepo = new PlayerRepository();

    // 初始化所有 Manager
    this.ItemManager = new ItemManager(this);
    this.MapManager = new MapManager(this);
    this.MapActionManager = new MapActionManager(this);
    this.MapBroadcastManager = new MapBroadcastManager(this);
    this.MapSpawnManager = new MapSpawnManager(this);
    this.PetManager = new PetManager(this);
    this.SystemManager = new SystemManager(this);
    this.NoNoManager = new NoNoManager(this);
    this.BattleManager = new BattleManager(this);
    this.MailManager = new MailManager(this);
    this.FriendManager = new FriendManager(this);
    this.TaskManager = new TaskManager(this);
    this.ChallengeProgressManager = new ChallengeProgressManager(this);
    this.GachaManager = new GachaManager(this);
    this.EventBus = new GameEventBus();
    this.RegisterAllEvents();
  }

  /**
   * 让每个 Manager 注册自己关心的事件
   * 各 Manager 在 RegisterEvents() 中自行注册，PlayerInstance 不关心具体事件
   */
  private RegisterAllEvents(): void {
    this.ItemManager.RegisterEvents(this.EventBus);
    this.MapManager.RegisterEvents(this.EventBus);
    this.MapActionManager.RegisterEvents(this.EventBus);
    this.MapBroadcastManager.RegisterEvents(this.EventBus);
    this.MapSpawnManager.RegisterEvents(this.EventBus);
    this.PetManager.RegisterEvents(this.EventBus);
    this.SystemManager.RegisterEvents(this.EventBus);
    this.NoNoManager.RegisterEvents(this.EventBus);
    this.BattleManager.RegisterEvents(this.EventBus);
    this.MailManager.RegisterEvents(this.EventBus);
    this.FriendManager.RegisterEvents(this.EventBus);
    this.TaskManager.RegisterEvents(this.EventBus);
    this.ChallengeProgressManager.RegisterEvents(this.EventBus);
    this.GachaManager.RegisterEvents(this.EventBus);
  }

  /**
   * 获取 Session
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
      Logger.Info(
        `[Player ${this.Uid}] 发送数据包: cmdId=${cmdId}, result=${result}, bodyLen=${bodyData.length}, packetLen=${packet.length}`
      );
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

    // 注意：不在这里调用 NoNoManager.OnLogin()
    // 原因：
    // 1. 如果玩家有 NoNo，客户端会根据登录响应中的 hasNono 字段主动请求 NoNo 信息或召唤
    // 2. 如果玩家没有 NoNo，不需要任何处理
    // 3. 服务器不应该主动推送 NoNo 信息

    // 派发登录事件
    await this.EventBus.Emit({
      type: PlayerEventType.LOGIN,
      timestamp: Date.now(),
      playerId: this.Uid,
    } as IPlayerLoginEvent);
  }

  /**
   * 玩家登出
   */
  public async OnLogout(): Promise<void> {
    Logger.Info(`[Player ${this.Uid}] 玩家登出: ${this.Data.nick}`);

    // 在清理前先派发登出事件，让各 Manager 自行处理退出逻辑
    await this.EventBus.Emit({
      type: PlayerEventType.LOGOUT,
      timestamp: Date.now(),
      playerId: this.Uid,
    } as IPlayerLogoutEvent);

    // 实时保存该玩家的所有数据
    await DatabaseHelper.Instance.SaveUser(this.Uid);

    // 清理 Session 中的 Player 引用
    this._session.Player = undefined;

    // 销毁事件总线
    this.EventBus.Destroy();

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
    await this.ChallengeProgressManager.Initialize();
    await this.GachaManager.Initialize();

    // 同步服装数据：从 ItemData 提取服装物品到 PlayerData.clothes
    this.syncClothesData();

    this.Initialized = true;
  }

  /**
   * 同步服装数据：从 ItemData 提取服装物品到 PlayerData.clothes
   */
  private syncClothesData(): void {
    // 从 ItemManager 中筛选出服装类物品
    const clothItems = this.ItemManager.GetClothItems();

    // 转换为 clothes 格式
    this.Data.clothes = clothItems.map(item => ({
      id: item.itemId,
      level: 0, // 服装没有等级概念，默认为0
      count: item.count
    }));

    this.Data.clothCount = this.Data.clothes.length;

    Logger.Debug(`[PlayerInstance] 同步服装数据: UserID=${this.Uid}, 服装数量=${this.Data.clothCount}`);
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
