import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 1005 GET_IMAGE_ADDRESS] 获取图片服务器地址响应
 */
export class GetImageAddressRspProto extends BaseProto {
  ip: string = '127.0.0.1';  // IP地址
  port: number = 80;          // 端口
  session: string = '';       // 会话

  constructor() {
    super(CommandID.GET_IMAGE_ADDRESS);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(34);
    
    writer.WriteBytes(this.buildString(this.ip, 16));
    writer.WriteUInt16(this.port);
    writer.WriteBytes(this.buildString(this.session, 16));
    
    return writer.ToBuffer();
  }

  setIp(ip: string): this {
    this.ip = ip;
    return this;
  }

  setPort(port: number): this {
    this.port = port;
    return this;
  }

  setSession(session: string): this {
    this.session = session;
    return this;
  }
}
