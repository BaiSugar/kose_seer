import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录响应
 */
export class MainLoginRspProto extends BaseProto {
  session: Buffer = Buffer.alloc(16);
  roleCreated: number = 0; // 1=已创建角色, 0=未创建角色

  constructor() {
    super(CommandID.MAIN_LOGIN_IN);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(20);
    writer.WriteBytes(this.session);
    writer.WriteUInt32(this.roleCreated);
    return writer.ToBuffer();
  }

  /**
   * 辅助方法：设置Session
   */
  setSession(sessionKey: string | undefined): this {
    if (sessionKey) {
      this.session = this.buildBuffer(sessionKey, 16);
    } else {
      // 随机生成session
      for (let i = 0; i < 16; i++) {
        this.session[i] = Math.floor(Math.random() * 256);
      }
    }
    return this;
  }

  /**
   * 辅助方法：设置角色创建状态
   */
  setRoleCreated(created: boolean): this {
    this.roleCreated = created ? 1 : 0;
    return this;
  }
}
