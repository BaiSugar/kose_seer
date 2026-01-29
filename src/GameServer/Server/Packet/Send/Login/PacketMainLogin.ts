import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { MainLoginRspProto } from '../../../../../shared/proto';

/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录响应数据包
 */
export class PacketMainLogin {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 构建主登录成功响应
   * @param userID 用户ID
   * @param roleCreated 是否已创建角色
   * @param sessionKey 会话密钥 (可选，不传则随机生成)
   */
  public Build(userID: number, roleCreated: boolean = true, sessionKey?: string): Buffer {
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
   * 构建主登录失败响应
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
  public BuildFailed(userID: number, errorCode: number): Buffer {
    return this._packetBuilder.Build(
      CommandID.MAIN_LOGIN_IN,
      userID,
      errorCode,  // result: 非0=失败
      Buffer.alloc(0)
    );
  }
}
