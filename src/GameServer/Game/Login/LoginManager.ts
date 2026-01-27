import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { LoginPacket } from '../../Server/Packet/Send/LoginPacket';
import { AccountRepository, SessionRepository, PlayerRepository } from '../../../DataBase';
import { Logger } from '../../../shared/utils';
import { IClientSession } from '../../Server/Packet/IHandler';
import { PlayerManager } from '../Player/PlayerManager';
import { MainLoginRspProto, CreateRoleRspProto } from '../../../shared/proto';
import { CryptoHandler } from '../../../shared/crypto';

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
  private _loginPacket: LoginPacket;
  private _accountRepo: AccountRepository;
  private _sessionRepo: SessionRepository;
  private _playerRepo: PlayerRepository;
  private _playerManager: PlayerManager;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
    this._loginPacket = new LoginPacket(packetBuilder);
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

      Logger.Info(`[LoginManager] 登录成功: userID=${userID}, roleCreated=${roleCreated}`);
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
        const proto = this._loginPacket.BuildGameLoginProto({ userID, nick: '', coins: 0, energy: 0, vipLevel: 0, vipValue: 0, clothCount: 0, clothes: [], mapID: 0, posX: 0, posY: 0 } as any, sessionKey);
        this.sendProto(session, userID, proto.setResult(LoginResult.SYSTEM_ERROR));
        return;
      }

      // 更新登录次数
      await this._playerRepo.IncrementLoginCount(userID);

      // 创建Player实例
      const playerInstance = await this._playerManager.CreatePlayer(session, userID, player.nick);

      // 生成加密密钥种子（随机数）
      const keySeed = Math.floor(Math.random() * 0xFFFFFFFF);

      Logger.Info(`[LoginManager] 游戏登录成功: userID=${userID}, nick=${player.nick}`);
      
      // 构建登录响应并设置 keySeed
      const proto = this._loginPacket.BuildGameLoginProto(player, sessionKey);
      proto.setKeySeed(keySeed);
      
      // 发送响应
      await playerInstance.SendPacket(proto);

      // 更新服务器端加密密钥
      if (!session.Crypto) {
        session.Crypto = new CryptoHandler();
      }

      // 使用与客户端相同的算法生成密钥
      const newKey = CryptoHandler.GenerateKey(keySeed, userID);
      session.Crypto.initKey(newKey);
      session.EncryptionEnabled = true;

      Logger.Info(`[LoginManager] 加密密钥已更新: userID=${userID}, keySeed=${keySeed}, key=${newKey}`);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[LoginManager] 游戏登录失败: ${userID}`, error);
      const proto = this._loginPacket.BuildGameLoginProto({ userID, nick: '', coins: 0, energy: 0, vipLevel: 0, vipValue: 0, clothCount: 0, clothes: [], mapID: 0, posX: 0, posY: 0 } as any, undefined);
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
      // 1. 创建玩家记录
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
