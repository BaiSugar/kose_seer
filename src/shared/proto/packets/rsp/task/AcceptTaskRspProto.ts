import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 接受任务响应
 * CMD 2201: ACCEPT_TASK
 */
export class AcceptTaskRspProto extends BaseProto {
  public taskId: number = 0;

  constructor() {
    super(CommandID.ACCEPT_TASK);
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.taskId, 0);
    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(0);
    }
  }

  public setTaskId(taskId: number): this {
    this.taskId = taskId;
    return this;
  }
}
