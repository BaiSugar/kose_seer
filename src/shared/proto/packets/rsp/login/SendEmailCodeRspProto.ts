import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码响应
 * 
 * 响应格式:
 * - emailCodeRes(32字节): 验证码响应（用于后续注册验证）
 */
export class SendEmailCodeRspProto extends BaseProto {
  emailCodeRes: string = '';

  constructor() {
    super(CommandID.SEND_EMAIL_CODE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(32);
    writer.WriteString(this.emailCodeRes, 32);
    return writer.ToBuffer();
  }

  /**
   * 辅助方法：设置验证码响应
   */
  setEmailCodeRes(codeRes: string): this {
    this.emailCodeRes = codeRes;
    return this;
  }
}
