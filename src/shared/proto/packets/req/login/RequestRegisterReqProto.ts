import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册
 * 
 * 预留接口，暂无请求参数
 */
export class RequestRegisterReqProto extends BaseProto {
  constructor() {
    super(0); // 请求Proto不需要cmdId
  }

  serialize(): Buffer {
    // 请求由客户端发送，服务器不需要序列化
    return Buffer.alloc(0);
  }

  /**
   * 从Buffer解析请求注册
   */
  deserialize(_buffer: Buffer): void {
    // 暂无参数
  }
}
