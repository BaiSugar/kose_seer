import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: REGISTER (2)] 注册账号请求
 * 
 * 请求格式:
 * - password(32字节): 密码
 * - emailAddress(64字节): 邮箱地址
 * - emailCode(32字节): 验证码
 * - emailCodeRes(32字节): 验证码响应
 */
export class RegisterReqProto extends BaseProto {
  password: string = '';
  emailAddress: string = '';
  emailCode: string = '';
  emailCodeRes: string = '';

  constructor() {
    super(0); // 请求Proto不需要cmdId
  }

  serialize(): Buffer {
    // 请求由客户端发送，服务器不需要序列化
    return Buffer.alloc(0);
  }

  /**
   * 从Buffer解析注册请求
   */
  deserialize(buffer: Buffer): void {
    if (buffer.length < 160) {
      throw new Error('RegisterReqProto: buffer length < 160');
    }

    this.password = buffer.toString('utf8', 0, 32).replace(/\0/g, '').trim();
    this.emailAddress = buffer.toString('utf8', 32, 96).replace(/\0/g, '').trim();
    this.emailCode = buffer.toString('utf8', 96, 128).replace(/\0/g, '').trim();
    this.emailCodeRes = buffer.toString('utf8', 128, 160).replace(/\0/g, '').trim();
  }
}
