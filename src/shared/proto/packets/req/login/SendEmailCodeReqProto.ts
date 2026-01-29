import { BaseProto } from '../../../base/BaseProto';

/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码请求
 * 
 * 请求格式:
 * - emailAddress(64字节): 邮箱地址
 */
export class SendEmailCodeReqProto extends BaseProto {
  emailAddress: string = '';

  constructor() {
    super(0); // 请求Proto不需要cmdId
  }

  serialize(): Buffer {
    // 请求由客户端发送，服务器不需要序列化
    return Buffer.alloc(0);
  }

  /**
   * 从Buffer解析发送验证码请求
   */
  deserialize(buffer: Buffer): void {
    if (buffer.length < 64) {
      throw new Error('SendEmailCodeReqProto: buffer length < 64');
    }

    this.emailAddress = buffer.toString('utf8', 0, 64).replace(/\0/g, '').trim();
  }
}
