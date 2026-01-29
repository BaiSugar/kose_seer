import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: OPEN_SUPER_NONO (80001)] 开启超级NoNo响应
 * 
 * Response Body:
 * - success (uint32): 是否成功 (0=成功, 1=失败)
 */
export class OpenSuperNonoRspProto extends BaseProto {
  success: number = 0;

  constructor(success: number = 0) {
    super(CommandID.OPEN_SUPER_NONO);
    this.success = success;
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(this.success);
    return writer.ToBuffer();
  }
}
