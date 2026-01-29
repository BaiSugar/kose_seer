import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RegisterRspProto } from '../../../../../shared/proto';

/**
 * [CMD: REGISTER (2)] 注册账号响应数据包
 */
export class PacketRegister {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 构建注册账号响应
   * @param userID 新注册的米米号 (成功时返回)
   * @param result 结果码 (0=成功, 5001=系统错误, 5002=邮箱已注册, 5012=验证码错误)
   */
  public Build(userID: number, result: number = 0): Buffer {
    const proto = new RegisterRspProto().setUserID(userID).setResult(result);

    return this._packetBuilder.Build(
      CommandID.REGISTER,
      userID,
      result,
      proto.serialize()
    );
  }
}
