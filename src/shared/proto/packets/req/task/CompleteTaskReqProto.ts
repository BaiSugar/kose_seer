import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 完成任务请求
 * CMD 2202: COMPLETE_TASK
 */
export class CompleteTaskReqProto extends BaseProto {
  public taskId: number = 0;
  public param: number = 0;

  constructor() {
    super(CommandID.COMPLETE_TASK);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 8) {
      this.param = buffer.readUInt32BE(offset);
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
