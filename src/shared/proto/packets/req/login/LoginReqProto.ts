import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: LOGIN_IN (1001)] 游戏登录请求
 * 用于解析客户端发来的登录请求
 */
export class LoginReqProto extends BaseProto {
  session: Buffer = Buffer.alloc(16);

  constructor() {
    super(0); // 请求Proto不需要cmdId
  }

  serialize(): Buffer {
    return this.session;
  }

  /**
   * 从Buffer快速解析
   */
  static fromBuffer(buffer: Buffer): LoginReqProto {
    const proto = new LoginReqProto();
    if (buffer.length >= 16) {
      proto.session = buffer.subarray(0, 16);
    }
    return proto;
  }

  /**
   * 获取Session字符串
   */
  getSessionKey(): string {
    return this.session.subarray(0, 8).toString('utf8').replace(/\0/g, '');
  }
}
