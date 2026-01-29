import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2231 ACCEPT_DAILY_TASK] 接受每日任务响应
 * 
 * 响应包体（Lua端实现：emptyResponse(2231, 4)）：
 * - 4字节的0（占位）
 * 
 * 注意：Lua端使用通用空响应，返回4字节的0
 */
export class AcceptDailyTaskRspProto extends BaseProto {
  constructor() {
    super(CommandID.ACCEPT_DAILY_TASK);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(4);
    writer.WriteUInt32(0); // 4字节占位
    return writer.ToBuffer();
  }

  deserialize(_buffer: Buffer): void {
    throw new Error('AcceptDailyTaskRspProto should not be deserialized');
  }
}
