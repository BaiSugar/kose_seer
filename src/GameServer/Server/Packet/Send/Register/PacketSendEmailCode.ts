import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { SendEmailCodeRspProto } from '../../../../../shared/proto';

/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码响应数据包
 */
export class PacketSendEmailCode {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 构建发送验证码响应
   * @param emailCodeRes 验证码响应（32字节）
   * @param result 结果码 (0=成功, 5001=系统错误)
   */
  public Build(emailCodeRes: string, result: number = 0): Buffer {
    const proto = new SendEmailCodeRspProto()
      .setEmailCodeRes(emailCodeRes)
      .setResult(result);

    return this._packetBuilder.Build(
      CommandID.SEND_EMAIL_CODE,
      0, // 注册前没有userID
      result,
      proto.serialize()
    );
  }
}
