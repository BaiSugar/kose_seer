import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: REGISTER (2)] 注册账号响应
 * 
 * 响应格式:
 * - result: 错误码 (0=成功, 5001=系统错误, 5002=邮箱已注册, 5012=验证码错误)
 * - userID: 新注册的米米号 (成功时返回)
 */
export class RegisterRspProto extends BaseProto {
  userID: number = 0;

  constructor() {
    super(CommandID.REGISTER);
  }

  serialize(): Buffer {
    // 注册响应不需要body，userID通过包头返回
    return Buffer.alloc(0);
  }

  /**
   * 辅助方法：设置用户ID
   */
  setUserID(userID: number): this {
    this.userID = userID;
    return this;
  }
}
