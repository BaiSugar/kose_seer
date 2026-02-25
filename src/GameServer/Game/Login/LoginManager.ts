import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { PacketMainLogin, PacketGameLogin, PacketCreateRole } from '../../Server/Packet/Send/Login';
import { PacketChangeCloth } from '../../Server/Packet/Send/Item/PacketChangeCloth';
import { PacketEnterMap } from '../../Server/Packet/Send/Map/PacketEnterMap';
import { AccountRepository, SessionRepository, PlayerRepository } from '../../../DataBase';
import { Logger } from '../../../shared/utils';
import { IClientSession } from '../../Server/Packet/IHandler';
import { PlayerManager } from '../Player/PlayerManager';
import { OnlineTracker } from '../Player/OnlineTracker';
import { MainLoginRspProto, CreateRoleRspProto } from '../../../shared/proto';

/**
 * 登录结果码 (与客户端 ParseLoginSocketError.as 保持一致)
 */
export enum LoginResult {
  SUCCESS = 0,
  SYSTEM_ERROR = 5001,           // 系统错误
  ACCOUNT_EXISTS = 5002,         // 号码已被注册
  PASSWORD_ERROR = 5003,         // 密码错误
  NOT_ACTIVATED = 5004,          // 号码尚未激活
  ACCOUNT_NOT_FOUND = 5005,      // 号码不存在
  BANNED_PERMANENT = 5006,       // 号码被永久封停
  BANNED_24H = 5007,             // 号码被24小时封停
  PROTOCOL_ERROR = 5008,         // 协议不对
  TOO_MANY_ATTEMPTS = 5009,      // 密码输错次数太多
  INVALID_NICKNAME = 5010,       // 不合法的昵称
  SERVER_MAINTENANCE = 5011,     // 服务器维护
  INVALID_INVITE_CODE = 5012,    // 非法的邀请码
  BANNED_PERMANENT_2 = 5013,     // 你的号码被永久封停
  BANNED_24H_2 = 5014,           // 你的号码被24小时封停
  BANNED_7D = 5015,              // 你的号码被7天封停
  BANNED_14D = 5016,             // 你的号码被14天封停
}

/**
 * 玩家信息接口
 */
export interface IPlayerData {
  userID: number;
  nickname: string;
  level: number;
  exp: number;
  coins: number;
  roleCreated: boolean;
}

/**
 * 登录管理器
 * 负责处理登录相关的业务逻辑
 */
export class LoginManager {
  private _packetBuilder: PacketBuilder;
  private _packetGameLogin: PacketGameLogin;
  private _accountRepo: AccountRepository;
  private _sessionRepo: SessionRepository;
  private _playerRepo: PlayerRepository;
  private _playerManager: PlayerManager;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
    this._packetGameLogin = new PacketGameLogin(packetBuilder);
    this._accountRepo = new AccountRepository();
    this._sessionRepo = new SessionRepository();
    this._playerRepo = new PlayerRepository();
    this._playerManager = PlayerManager.GetInstance(packetBuilder);
  }

  /**
   * 发送Proto响应（没有Player实例时使用）
   */
  private sendProto(session: IClientSession, userID: number, proto: any): void {
    const packet = this._packetBuilder.Build(
      proto.getCmdId(),
      userID,
      proto.getResult(),
      proto.serialize()
    );
    session.Socket.write(packet);
  }

  /**
   * 处理主登录
   * @param session 客户端会话
   * @param userID 用户ID (米米号)
   * @param passwordMD5 密码MD5
   */
  public async HandleMainLogin(session: IClientSession, userID: number, passwordMD5?: Buffer): Promise<void> {
    try {
      // 验证账号是否存在
      const account = await this._accountRepo.FindAccountById(userID);
      if (!account) {
        Logger.Warn(`[LoginManager] 账号不存在: ${userID}`);
        this.sendProto(session, userID, new MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
        return;
      }

      // 验证密码
      if (passwordMD5) {
        const passwordStr = passwordMD5.toString('utf8').replace(/\0/g, '').trim();
        if (passwordStr && account.passwordHash !== passwordStr) {
          Logger.Warn(`[LoginManager] 密码错误: ${userID}`);
          this.sendProto(session, userID, new MainLoginRspProto().setResult(LoginResult.PASSWORD_ERROR));
          return;
        }
      }

      // 检查账号状态
      if (account.status !== 0) {
        Logger.Warn(`[LoginManager] 账号状态异常: ${userID}, status=${account.status}`);
        const banResult = this.getBanResultCode(account.status);
        this.sendProto(session, userID, new MainLoginRspProto().setResult(banResult));
        return;
      }

      // 创建会话
      const ip = session.Address || '127.0.0.1';
      const sessionInfo = await this._sessionRepo.CreateSession(userID, ip, 1);

      // 更新最后登录时间
      await this._accountRepo.UpdateLastLogin(userID, ip);

      // 检查是否已创建角色
      const roleCreated = account.roleCreated;

      Logger.Info(`[LoginManager] 主登录成功（玩家上线，未进入服务器）: userID=${userID}, roleCreated=${roleCreated}`);
      const proto = new MainLoginRspProto()
        .setSession(sessionInfo.sessionKey)
        .setRoleCreated(roleCreated);
      this.sendProto(session, userID, proto);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 登录失败: ${userID}`, error);
      this.sendProto(session, userID, new MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
    }
  }

  /**
   * 处理邮箱登录
   * @param session 客户端会话
   * @param email 邮箱地址
   * @param passwordMD5 密码MD5
   */
  public async HandleEmailLogin(session: IClientSession, email: string, passwordMD5?: Buffer): Promise<void> {
    try {
      // 1. 根据邮箱查找账号
      const account = await this._accountRepo.FindByEmail(email);
      if (!account) {
        Logger.Warn(`[LoginManager] 邮箱账号不存在: ${email}`);
        this.sendProto(session, 0, new MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
        return;
      }

      const userID = account.id;
      session.UserID = userID; // 设置session的UserID

      // 2. 验证密码
      if (passwordMD5) {
        const passwordStr = passwordMD5.toString('utf8').replace(/\0/g, '').trim();
        if (passwordStr && account.passwordHash !== passwordStr) {
          Logger.Warn(`[LoginManager] 邮箱登录密码错误: ${email}`);
          this.sendProto(session, userID, new MainLoginRspProto().setResult(LoginResult.PASSWORD_ERROR));
          return;
        }
      }

      // 3. 检查账号状态
      if (account.status !== 0) {
        Logger.Warn(`[LoginManager] 账号状态异常: ${userID}, status=${account.status}`);
        const banResult = this.getBanResultCode(account.status);
        this.sendProto(session, userID, new MainLoginRspProto().setResult(banResult));
        return;
      }

      // 4. 创建会话
      const ip = session.Address || '127.0.0.1';
      const sessionInfo = await this._sessionRepo.CreateSession(userID, ip, 1);

      // 5. 更新最后登录时间
      await this._accountRepo.UpdateLastLogin(userID, ip);

      // 6. 检查是否已创建角色
      const roleCreated = account.roleCreated;

      // 注意：不在这里创建 PlayerInstance
      // PlayerInstance 应该在 CMD 1001 (LOGIN_IN) 时创建
      // 这里只是验证账号密码，返回 session token

      Logger.Info(`[LoginManager] 邮箱登录成功: userID=${userID}, email=${email}, roleCreated=${roleCreated}`);
      const proto = new MainLoginRspProto()
        .setSession(sessionInfo.sessionKey)
        .setRoleCreated(roleCreated);
      this.sendProto(session, userID, proto);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 邮箱登录失败: ${email}`, error);
      this.sendProto(session, 0, new MainLoginRspProto().setResult(LoginResult.SYSTEM_ERROR));
    }
  }

  /**
   * 根据账号状态获取封禁错误码
   */
  private getBanResultCode(status: number): LoginResult {
    switch (status) {
      case 1: return LoginResult.BANNED_24H;      // 24小时封停
      case 2: return LoginResult.BANNED_7D;       // 7天封停
      case 3: return LoginResult.BANNED_14D;      // 14天封停
      case 4: return LoginResult.BANNED_PERMANENT; // 永久封停
      default: return LoginResult.BANNED_PERMANENT;
    }
  }

  /**
   * 处理游戏登录
   * @param session 客户端会话
   * @param userID 用户ID
   * @param sessionData 会话标识
   */
  public async HandleGameLogin(session: IClientSession, userID: number, sessionData?: Buffer): Promise<void> {
    try {
      let sessionKey: string | undefined;

      // 提取会话标识 (前8字节)
      if (sessionData && sessionData.length >= 8) {
        sessionKey = sessionData.subarray(0, 8).toString('utf8').replace(/\0/g, '');
      }

      // 获取玩家数据
      const player = await this._playerRepo.FindByUserId(userID);
      if (!player) {
        Logger.Warn(`[LoginManager] 玩家不存在: ${userID}`);
        const proto = this._packetGameLogin.BuildProto({ userID, nick: '', coins: 0, energy: 0, vipLevel: 0, vipValue: 0, clothCount: 0, clothes: [], mapID: 0, posX: 0, posY: 0 } as any, sessionKey);
        this.sendProto(session, userID, proto.setResult(LoginResult.SYSTEM_ERROR));
        return;
      }

      // 更新登录次数
      await this._playerRepo.IncrementLoginCount(userID);

      // 随机登录地图（除新账号外）
      // 新账号判断：mapID == 515 表示在新手地图，保持不变
      // 老玩家：随机传送到 1-9 地图（排除mapID=2）
      // 新手任务判断：curFreshStage < maxFreshStage 表示新手任务未完成，保持新手地图
      if (player.mapID !== 515 && player.curFreshStage >= player.maxFreshStage) {
        // 可选地图：1, 4, 5, 6, 7, 8, 9（排除2）
        const availableMaps = [1, 4, 5, 6, 7, 8, 9];
        const randomMapId = availableMaps[Math.floor(Math.random() * availableMaps.length)];
        player.mapID = randomMapId;
        await this._playerRepo.UpdatePlayerMap(userID, randomMapId);
        Logger.Info(`[LoginManager] 老玩家随机登录地图: userID=${userID}, mapID=${randomMapId}`);
      } else {
        // 新手任务未完成，保持新手地图
        if (player.mapID !== 515) {
          player.mapID = 515;
          await this._playerRepo.UpdatePlayerMap(userID, 515);
        }
        Logger.Info(`[LoginManager] 新手任务未完成，保持新手地图: userID=${userID}, curFreshStage=${player.curFreshStage}, maxFreshStage=${player.maxFreshStage}`);
      }

      // 创建Player实例
      const playerInstance = await this._playerManager.CreatePlayer(session, userID, player.nick);

      Logger.Info(`[LoginManager] 游戏登录成功: userID=${userID}, nick=${player.nick}`);
      
      // 构建登录响应
      const proto = this._packetGameLogin.BuildProto(player, sessionKey);
      
      Logger.Debug(`[LoginManager] 发送登录响应: loginCnt=${proto.loginCnt}, timeLimit=${proto.timeLimit}, mapId=${proto.mapId}, curStage=${proto.curStage}, maxStage=${proto.maxStage}, curFreshStage=${proto.curFreshStage}, maxFreshStage=${proto.maxFreshStage}`);
      Logger.Debug(`[LoginManager] regTime=${proto.regTime} (${new Date(proto.regTime * 1000).toISOString()}), userId=${proto.userId}, nick=${proto.nickname}`);
      
      // 加载任务数据并填充到 Proto
      proto.taskList = playerInstance.TaskManager.TaskData.GetTaskStatusArray();
      
      Logger.Debug(`[LoginManager] 任务数据: 共${playerInstance.TaskManager.TaskData.TaskList.size}个任务`);
      
      // 加载精灵数据并填充到 Proto（仅背包精灵）
      // 客户端的 initData() 只接收背包精灵的完整信息
      // 仓库精灵通过 getStorageList() 单独获取（发送 GET_PET_LIST）
      const bagPets = playerInstance.PetManager.PetData.GetPetsInBag();
      
      Logger.Debug(`[LoginManager] 背包精灵数: ${bagPets.length}`);
      
      if (bagPets.length > 0) {
        Logger.Debug(`[LoginManager] 背包精灵列表（排序后）: ${JSON.stringify(bagPets.map((p, idx) => ({
          index: idx,
          petId: p.petId,
          level: p.level,
          isDefault: p.isDefault,
          catchTime: p.catchTime
        })))}`);
      }
      
      proto.petList = playerInstance.PetManager.GetPetProtoList(bagPets);
      
      Logger.Info(`[LoginManager] 精灵数据: 共${bagPets.length}个背包精灵`);
      if (bagPets.length > 0) {
        Logger.Info(`[LoginManager] 背包精灵: ${bagPets.map((p, idx) => `[${idx}]${p.petId}(Lv${p.level},${p.isDefault ? '首发' : ''},CT:0x${p.catchTime.toString(16)})`).join(', ')}`);
        Logger.Debug(`[LoginManager] proto.petList 长度: ${proto.petList.length}`);
        Logger.Debug(`[LoginManager] proto.petList[0]: ${JSON.stringify({
          id: proto.petList[0]?.id,
          level: proto.petList[0]?.level,
          catchTime: proto.petList[0]?.catchTime,
          isDefault: bagPets[0]?.isDefault
        })}`);
      } else {
        Logger.Warn(`[LoginManager] 玩家没有背包精灵！UserID=${userID}`);
      }
      
      // 加载服装数据并填充到 Proto
      const clothList = playerInstance.ItemManager.ItemData.ItemList
        .filter(item => {
          // 过滤出服装类物品（ID范围 100000-199999）
          return item.itemId >= 100000 && item.itemId < 200000;
        })
        .map(item => ({
          id: item.itemId,
          level: 0  // 服装没有等级概念，默认为0
        }));
      
      proto.clothList = clothList;
      Logger.Info(`[LoginManager] 服装数据: 共${clothList.length}个服装`);

      // 加载挑战进度数据并填充到 Proto
      const achievementBuffer = playerInstance.ChallengeProgressManager.GetAchievementBuffer();
      proto.bossAchievement = Array.from(achievementBuffer).map(b => b === 1);
      const achievementCount = proto.bossAchievement.filter(a => a).length;
      Logger.Info(`[LoginManager] 挑战进度数据: SPT BOSS击败=${achievementCount}/200`);

      // 发送响应
      await playerInstance.SendPacket(proto);
      
      Logger.Info(`[LoginManager] 登录包已发送，等待客户端响应...`);

      // 登录后处理：调用各Manager的OnLogin方法（在发送响应之后）
      await playerInstance.OnLogin();
      
      Logger.Info(`[LoginManager] OnLogin完成，玩家已完全登录`);

      // pushInitialMapEnter: 登录成功后主动推送 2001/2003/2004，使客户端直接进入地图
      const mapId = playerInstance.Data.mapID;
      const x = playerInstance.Data.posX || 500;
      const y = playerInstance.Data.posY || 300;
      
      Logger.Info(`[LoginManager] pushInitialMapEnter: UID=${userID}, MapID=${mapId}, X=${x}, Y=${y}`);
      
      // 添加玩家到地图
      OnlineTracker.Instance.PlayerLogin(userID, session);
      OnlineTracker.Instance.UpdatePlayerMap(userID, mapId, 0, x, y);
      
      // 构建并发送 2001 (ENTER_MAP)
      const userInfo = playerInstance.MapManager.buildUserInfo(userID, playerInstance.Data, x, y, playerInstance);
      await playerInstance.SendPacket(new PacketEnterMap(userInfo));
      
      // 发送 2003 (LIST_MAP_PLAYER) - 包含同地图所有人
      await playerInstance.MapManager.sendMapPlayerList(mapId);
      
      // 发送 2004 (MAP_OGRE_LIST)
      await playerInstance.MapManager.sendMapOgreList(mapId);
      
      // 发送 2021 (MAP_BOSS)
      await playerInstance.MapManager.sendMapBossList(mapId);
      
      // 发送 9003 (Nono info) - 使客户端 NonoManager.info 有完整数据
      await playerInstance.NoNoManager.HandleNoNoInfo();
      
      Logger.Info(`[LoginManager] pushInitialMapEnter 完成: UID=${userID}, MapID=${mapId}`);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 游戏登录失败: ${userID}`, error);
      const proto = this._packetGameLogin.BuildProto({ userID, nick: '', coins: 0, energy: 0, vipLevel: 0, vipValue: 0, clothCount: 0, clothes: [], mapID: 0, posX: 0, posY: 0 } as any, undefined);
      this.sendProto(session, userID, proto.setResult(LoginResult.SYSTEM_ERROR));
    }
  }

  /**
   * 获取玩家数据
   */
  public async GetPlayer(userID: number): Promise<IPlayerData | null> {
    try {
      const player = await this._playerRepo.FindByUserId(userID);
      if (!player) return null;

      return {
        userID: player.userID,
        nickname: player.nick,
        level: 1,
        exp: 0,
        coins: player.coins,
        roleCreated: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 获取玩家数据失败: ${userID}`, error);
      return null;
    }
  }

  /**
   * 创建玩家
   * @param session 客户端会话
   * @param userID 用户ID
   * @param nickname 昵称
   * @param color 颜色
   */
  public async CreatePlayer(session: IClientSession, userID: number, nickname: string, color: number = 0): Promise<void> {
    try {
      // 1. 创建玩家记录（使用 Repository）
      // 注意：PlayerData 不走 DataSaver，而是通过 PlayerRepository 直接操作数据库
      await this._playerRepo.CreatePlayer(userID, nickname, color);
      
      // 2. 标记角色已创建
      await this._accountRepo.UpdateRoleCreated(userID, true);

      // 3. 生成新会话
      const ip = session.Address || '127.0.0.1';
      const sessionInfo = await this._sessionRepo.CreateSession(userID, ip, 1);

      Logger.Info(`[LoginManager] 创建玩家成功: userID=${userID}, nick=${nickname}, color=${color}`);
      const proto = new CreateRoleRspProto().setSession(sessionInfo.sessionKey);
      this.sendProto(session, userID, proto);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 创建玩家失败: ${userID}`, error);
      this.sendProto(session, userID, new CreateRoleRspProto().setResult(1));
    }
  }

  /**
   * 玩家登出
   */
  public async HandleLogout(userID: number): Promise<void> {
    try {
      await this._sessionRepo.InvalidateAllByAccountId(userID);
      Logger.Info(`[LoginManager] 玩家登出: userID=${userID}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 登出处理失败: ${userID}`, error);
    }
  }
}
