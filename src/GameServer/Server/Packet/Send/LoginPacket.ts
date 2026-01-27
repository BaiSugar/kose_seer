import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../shared/protocol/CommandID';
import { IPlayerInfo, PlayerInfoToLoginProto } from '../../../../shared/models';
import { 
  LoginRspProto, 
  MainLoginRspProto, 
  CreateRoleRspProto 
} from '../../../../shared/proto';

/**
 * 登录响应数据包
 *
 * 包含命令:
 * - [CMD: MAIN_LOGIN_IN (104)] 主登录响应
 * - [CMD: LOGIN_IN (1001)] 游戏登录响应
 * - [CMD: CREATE_ROLE (108)] 创建角色响应
 */
export class LoginPacket {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * [CMD: MAIN_LOGIN_IN (104)] 主登录响应
   * @param userID 用户ID
   * @param roleCreated 是否已创建角色
   * @param sessionKey 会话密钥 (可选，不传则随机生成)
   */
  public MainLogin(userID: number, roleCreated: boolean = true, sessionKey?: string): Buffer {
    const proto = new MainLoginRspProto();
    proto.setSession(sessionKey);
    proto.setRoleCreated(roleCreated);

    return this._packetBuilder.Build(
      CommandID.MAIN_LOGIN_IN,
      userID,
      0,  // result: 0=成功
      proto.serialize()
    );
  }

  /**
   * [CMD: MAIN_LOGIN_IN (104)] 主登录失败响应
   * @param userID 用户ID
   * @param errorCode 错误码 (使用 LoginResult 枚举)
   *   - 5001: 系统错误
   *   - 5003: 密码错误
   *   - 5005: 号码不存在
   *   - 5006: 号码被永久封停
   *   - 5007: 号码被24小时封停
   *   - 5015: 号码被7天封停
   *   - 5016: 号码被14天封停
   */
  public MainLoginFailed(userID: number, errorCode: number): Buffer {
    return this._packetBuilder.Build(
      CommandID.MAIN_LOGIN_IN,
      userID,
      errorCode,  // result: 非0=失败
      Buffer.alloc(0)
    );
  }

  /**
   * [CMD: LOGIN_IN (1001)] 游戏登录响应
   * 使用Proto风格构建响应
   * @param userID 用户ID
   * @param result 结果码 (0=成功)
   * @param player 玩家数据 (成功时需要)
   * @param sessionKey 会话标识
   */
  public GameLogin(userID: number, result: number = 0, player?: IPlayerInfo, sessionKey?: string): Buffer {
    // 失败时返回空 body
    if (result !== 0 || !player) {
      return this._packetBuilder.Build(
        CommandID.LOGIN_IN,
        userID,
        result,
        Buffer.alloc(0)
      );
    }

    const proto = this.BuildGameLoginProto(player, sessionKey);
    return this._packetBuilder.Build(
      CommandID.LOGIN_IN,
      userID,
      result,
      proto.serialize()
    );
  }

  /**
   * 构建游戏登录Proto（供Player.SendPacket使用）
   */
  public BuildGameLoginProto(player: IPlayerInfo, sessionKey?: string): LoginRspProto {
    return PlayerInfoToLoginProto(player, sessionKey);
  }

  /**
   * [CMD: CREATE_ROLE (108)] 创建角色响应
   * @param userID 用户ID
   * @param result 结果码 (0=成功, 5001=系统错误)
   * @param sessionKey 会话密钥 (成功时需要)
   */
  public CreateRole(userID: number, result: number = 0, sessionKey?: string): Buffer {
    // 成功时返回 session
    if (result === 0 && sessionKey) {
      const proto = new CreateRoleRspProto();
      proto.setSession(sessionKey);

      return this._packetBuilder.Build(
        CommandID.CREATE_ROLE,
        userID,
        result,
        proto.serialize()
      );
    }

    // 失败时返回空 body
    return this._packetBuilder.Build(
      CommandID.CREATE_ROLE,
      userID,
      result,
      Buffer.alloc(0)
    );
  }
}
