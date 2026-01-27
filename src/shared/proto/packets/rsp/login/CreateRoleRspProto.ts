import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: CREATE_ROLE (108)] 创建角色响应
 */
export class CreateRoleRspProto extends BaseProto {
  session: Buffer = Buffer.alloc(16);

  constructor() {
    super(CommandID.CREATE_ROLE);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(16);
    writer.WriteBytes(this.session);
    return writer.ToBuffer();
  }

  /**
   * 辅助方法：设置Session
   */
  setSession(sessionKey: string | undefined): this {
    if (sessionKey) {
      this.session = this.buildBuffer(sessionKey, 16);
    }
    return this;
  }
}
