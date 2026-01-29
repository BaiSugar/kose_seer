import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { CreateRoleRspProto } from '../../../../../shared/proto';

/**
 * [CMD: CREATE_ROLE (108)] 创建角色响应数据包
 */
export class PacketCreateRole {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 构建创建角色响应
   * @param userID 用户ID
   * @param result 结果码 (0=成功, 5001=系统错误)
   * @param sessionKey 会话密钥 (成功时需要)
   */
  public Build(userID: number, result: number = 0, sessionKey?: string): Buffer {
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
