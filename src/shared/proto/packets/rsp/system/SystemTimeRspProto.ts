import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 1002 SYSTEM_TIME] 系统时间响应
 */
export class SystemTimeRspProto extends BaseProto {
  timestamp: number = 0;  // 时间戳
  num: number = 0;        // 数量（固定为0）

  constructor() {
    super(CommandID.SYSTEM_TIME);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(8);
    writer.WriteUInt32(this.timestamp);
    writer.WriteUInt32(this.num);
    return writer.ToBuffer();
  }

  setTimestamp(timestamp: number): this {
    this.timestamp = timestamp;
    return this;
  }
}
