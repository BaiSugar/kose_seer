import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2410 ESCAPE_FIGHT] 逃跑响应
 */
export class EscapeFightRspProto extends BaseProto {
  success: number = 1;         // 是否成功 (0=失败, 1=成功)

  constructor() {
    super(CommandID.ESCAPE_FIGHT);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(8);
    
    writer.WriteUInt32(this.success);
    
    return writer.ToBuffer();
  }

  // 链式调用
  setSuccess(value: number): this {
    this.success = value;
    return this;
  }
}
