import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetImageAddressRspProto } from '../../../../../shared/proto/packets/rsp/system/GetImageAddressRspProto';

/**
 * 获取图片服务器地址响应包
 * CMD 1005
 */
export class PacketGetImageAddress extends BaseProto {
  private _data: Buffer;

  constructor(ip: string, port: number, session: string) {
    super(CommandID.GET_IMAGE_ADDRESS);
    const proto = new GetImageAddressRspProto();
    proto.ip = ip;
    proto.port = port;
    proto.session = session;
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
