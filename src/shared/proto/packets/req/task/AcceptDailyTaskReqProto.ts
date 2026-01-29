import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2231 ACCEPT_DAILY_TASK] 接受每日任务请求
 * 
 * 请求包体：
 * - taskId (4) - 每日任务ID
 */
export class AcceptDailyTaskReqProto extends BaseProto {
  taskId: number = 0;

  constructor() {
    super(CommandID.ACCEPT_DAILY_TASK);
  }

  deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(0);
    }
  }

  serialize(): Buffer {
    throw new Error('AcceptDailyTaskReqProto should not be serialized');
  }
}
