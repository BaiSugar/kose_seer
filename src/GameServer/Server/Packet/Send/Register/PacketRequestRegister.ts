import { PacketBuilder } from '../../../../../shared/protocol/PacketBuilder';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { RequestRegisterRspProto } from '../../../../../shared/proto';

/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册响应数据包
 */
export class PacketRequestRegister {
  private _packetBuilder: PacketBuilder;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
  }

  /**
   * 构建请求注册响应
   * @param result 结果码 (0=成功)
   */
  public Build(result: number = 0): Buffer {
    const proto = new RequestRegisterRspProto().setResult(result);

    return this._packetBuilder.Build(
      CommandID.REQUEST_REGISTER,
      0,
      result,
      proto.serialize()
    );
  }
}
